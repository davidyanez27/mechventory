import { and, count, eq } from 'drizzle-orm';
import type { Company, UpdateCompanyDto } from '@serveless/shared/company';
import type { InviteMemberDto } from '@serveless/shared/user';
import { db } from '../../db/client.js';
import { companies, companyMembers, users } from '../../db/schema/index.js';

type CompanyRow = typeof companies.$inferSelect;

const toDto = (row: CompanyRow): Company => ({
  id: row.uuid,
  name: row.name,
  companyType: row.companyType,
  idType: row.idType,
  idValue: row.idValue,
  currency: row.currency,
  address: row.address,
  country: row.country,
  phone: row.phone,
  email: row.email,
  logo: row.logo,
  isActive: row.isActive,
});

// Companies are scoped by membership, not by companyId: "the companies this
// user belongs to" (today always exactly one — the workspace).
const memberOf = (userId: number) =>
  and(eq(companyMembers.userId, userId), eq(companyMembers.isActive, true));

export const findAll = async (userId: number, page: number, limit: number) => {
  const [[{ total }], rows] = await Promise.all([
    db
      .select({ total: count() })
      .from(companies)
      .innerJoin(companyMembers, eq(companyMembers.companyId, companies.id))
      .where(memberOf(userId)),
    db
      .select({ company: companies })
      .from(companies)
      .innerJoin(companyMembers, eq(companyMembers.companyId, companies.id))
      .where(memberOf(userId))
      .orderBy(companies.id)
      .limit(limit)
      .offset((page - 1) * limit),
  ]);

  return {
    data: rows.map((r) => toDto(r.company)),
    pagination: {
      page,
      limit,
      total,
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

export const findByUuid = async (userId: number, uuid: string): Promise<Company | null> => {
  const [row] = await db
    .select({ company: companies })
    .from(companies)
    .innerJoin(companyMembers, eq(companyMembers.companyId, companies.id))
    .where(and(eq(companies.uuid, uuid), memberOf(userId)))
    .limit(1);
  return row ? toDto(row.company) : null;
};

// The identity's own companyId scopes the update — you can only ever update
// the workspace you act in, regardless of which uuid the URL carries.
export const update = async (
  companyId: number,
  dto: UpdateCompanyDto,
): Promise<Company | null> => {
  const changes: Partial<typeof companies.$inferInsert> = {};
  if (dto.name !== undefined) changes.name = dto.name;
  if (dto.companyType !== undefined) changes.companyType = dto.companyType;
  if (dto.email !== undefined) changes.email = dto.email;
  if (dto.phone !== undefined) changes.phone = dto.phone;
  if (dto.address !== undefined) changes.address = dto.address;
  if (dto.country !== undefined) changes.country = dto.country;
  if (dto.currency !== undefined) changes.currency = dto.currency;
  if (dto.idType !== undefined && dto.idValue !== undefined) {
    changes.idType = dto.idType;
    changes.idValue = dto.idValue;
  }
  if (dto.logo !== undefined) changes.logo = dto.logo;

  const [row] = await db
    .update(companies)
    .set(changes)
    .where(and(eq(companies.uuid, dto.uuid), eq(companies.id, companyId)))
    .returning();
  return row ? toDto(row) : null;
};

// Single-membership model: one email is one account, so an address that
// exists anywhere can't be invited into another workspace.
export const emailTaken = async (email: string): Promise<boolean> => {
  const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  return !!row;
};

// Invited users never pass through the post-confirmation trigger (it only
// fires for self-signups), so their user + membership rows are created here.
export const addMember = async (
  companyId: number,
  dto: InviteMemberDto,
  cognitoSub: string,
): Promise<void> => {
  await db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({ cognitoSub, email: dto.email, fullName: dto.fullName })
      .returning({ id: users.id });
    await tx.insert(companyMembers).values({
      companyId,
      userId: user.id,
      companyRole: dto.role,
    });
  });
};
