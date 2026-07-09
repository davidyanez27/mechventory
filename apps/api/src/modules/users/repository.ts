import { and, count, eq } from 'drizzle-orm';
import type { User } from '@serveless/shared/user';
import { db } from '../../db/client.js';
import { companyMembers, users } from '../../db/schema/index.js';

const memberColumns = {
  uuid: users.uuid,
  email: users.email,
  fullName: users.fullName,
  companyRole: companyMembers.companyRole,
  isActive: users.isActive,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

type MemberRow = {
  uuid: string;
  email: string;
  fullName: string;
  companyRole: 'OWNER' | 'ADMIN' | 'MEMBER';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const toDto = (row: MemberRow): User => ({
  uuid: row.uuid,
  email: row.email,
  fullName: row.fullName,
  companyRole: row.companyRole,
  isActive: row.isActive,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const findAll = async (companyId: number, page: number, limit: number) => {
  const [[{ total }], rows] = await Promise.all([
    db
      .select({ total: count() })
      .from(users)
      .innerJoin(companyMembers, eq(companyMembers.userId, users.id))
      .where(eq(companyMembers.companyId, companyId)),
    db
      .select(memberColumns)
      .from(users)
      .innerJoin(companyMembers, eq(companyMembers.userId, users.id))
      .where(eq(companyMembers.companyId, companyId))
      .orderBy(users.id)
      .limit(limit)
      .offset((page - 1) * limit),
  ]);

  return {
    data: rows.map(toDto),
    pagination: {
      page,
      limit,
      total,
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

export const findByUuid = async (companyId: number, uuid: string): Promise<User | null> => {
  const [row] = await db
    .select(memberColumns)
    .from(users)
    .innerJoin(companyMembers, eq(companyMembers.userId, users.id))
    .where(and(eq(users.uuid, uuid), eq(companyMembers.companyId, companyId)))
    .limit(1);
  return row ? toDto(row) : null;
};

// Resolves the target through the membership join first: you can only touch
// users that belong to your own workspace.
const resolveMemberId = async (companyId: number, uuid: string): Promise<number | null> => {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .innerJoin(companyMembers, eq(companyMembers.userId, users.id))
    .where(and(eq(users.uuid, uuid), eq(companyMembers.companyId, companyId)))
    .limit(1);
  return row ? row.id : null;
};

export const updateFullName = async (
  companyId: number,
  uuid: string,
  fullName: string,
): Promise<boolean> => {
  const id = await resolveMemberId(companyId, uuid);
  if (id === null) return false;
  await db.update(users).set({ fullName }).where(eq(users.id, id));
  return true;
};

// Soft delete: identityMiddleware filters on users.isActive, so the member
// loses API access immediately; their rows (invoices etc.) stay referenced.
export const deactivate = async (companyId: number, uuid: string): Promise<boolean> => {
  const id = await resolveMemberId(companyId, uuid);
  if (id === null) return false;
  await db.update(users).set({ isActive: false }).where(eq(users.id, id));
  return true;
};

// Public columns only — internal id and cognitoSub must never leave the API.
export const findSelf = async (userId: number) => {
  const [user] = await db
    .select({
      uuid: users.uuid,
      email: users.email,
      fullName: users.fullName,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId));
  return user ?? null;
};
