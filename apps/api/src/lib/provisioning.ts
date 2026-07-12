import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { companies, companyMembers, customers, users } from '../db/schema/index.js';

export type ProvisionInput = {
  /** Cognito user `sub` (stable, unique per pool). */
  sub: string;
  email: string;
  /** Display name; falls back to the email when Cognito has no `name`. */
  fullName: string;
};

/**
 * Creates a user's first workspace: user + company + OWNER membership + the seed
 * "Cliente General" walk-in customer, in one transaction.
 *
 * Called from two places so every sign-up route provisions identically:
 *   - the Cognito post-confirmation trigger (native email/password signups), and
 *   - identityMiddleware, lazily, on the first authenticated request (Google /
 *     federated users, for whom post-confirmation never fires).
 *
 * Idempotent by `cognitoSub`: a pre-check skips work when the rows exist, and the
 * unique constraints on users.cognito_sub / users.email backstop any race between
 * two concurrent first requests (the loser's INSERT throws — callers treat that
 * as "already provisioned").
 */
export const provisionWorkspace = async ({ sub, email, fullName }: ProvisionInput): Promise<void> => {
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.cognitoSub, sub));
  if (existing) return;

  await db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({ cognitoSub: sub, email, fullName })
      .returning({ id: users.id });

    // Workspace names are globally unique (DB constraint); on collision keep
    // suffixing a counter. The constraint backstops any race between checks.
    const baseName = `${fullName}'s workspace`;
    let name = baseName;
    for (let attempt = 2; ; attempt++) {
      const [taken] = await tx
        .select({ id: companies.id })
        .from(companies)
        .where(eq(companies.name, name))
        .limit(1);
      if (!taken) break;
      name = `${baseName} ${attempt}`;
    }

    const [company] = await tx
      .insert(companies)
      .values({ name, email })
      .returning({ id: companies.id });

    await tx.insert(companyMembers).values({
      companyId: company.id,
      userId: user.id,
      companyRole: 'OWNER',
    });

    // Seed walk-in customer for cash sales (matches native signup provisioning).
    await tx.insert(customers).values({
      companyId: company.id,
      name: 'Cliente General',
      phone: 'N/A',
      billingAddress: 'N/A',
      shippingAddress: 'N/A',
      notes: 'System-generated walk-in customer for cash sales',
      type: 'WALK_IN',
      identifier: 'WALK-IN',
    });
  });
};
