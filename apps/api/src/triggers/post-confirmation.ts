import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { companies, companyMembers, customers, users } from '../db/schema/index.js';

// Minimal structural type for the Cognito PostConfirmation event — enough for
// what we read, without pulling in @types/aws-lambda.
type PostConfirmationEvent = {
  triggerSource: string;
  request: { userAttributes: Record<string, string | undefined> };
};

// Runs once when a user confirms their signup code, before their first login.
// Mirrors Backend-main's registerWithCompany transaction: user + company +
// OWNER membership + seed walk-in customer.
export const handler = async (event: PostConfirmationEvent): Promise<PostConfirmationEvent> => {
  // Also fires for forgot-password confirmations — only provision on signup.
  if (event.triggerSource !== 'PostConfirmation_ConfirmSignUp') return event;

  const attributes = event.request.userAttributes;
  const sub = attributes.sub;
  const email = attributes.email;
  const fullName = attributes.name ?? email;

  if (!sub || !email || !fullName) {
    throw new Error('PostConfirmation event is missing required attributes (sub, email)');
  }

  // Idempotency: Cognito retries the trigger on timeout/error. If the rows
  // already exist, confirm silently instead of creating a duplicate company.
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.cognitoSub, sub));
  if (existing) return event;

  await db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({ cognitoSub: sub, email, fullName })
      .returning({ id: users.id });

    // The workspace is a backend concept: named here, renameable later via the
    // companies endpoint. Names are unique (DB constraint); on collision keep
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

    // Same seed customer Backend-main created on register (cash sales).
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

  return event;
};
