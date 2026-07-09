import { and, count, eq } from 'drizzle-orm';
import type { CreateCustomerDto, Customer, UpdateCustomerDto } from '@serveless/shared/customer';
import { db } from '../../db/client.js';
import { customers } from '../../db/schema/index.js';

type CustomerRow = typeof customers.$inferSelect;

// The DB stores the identifier flat (type_identifier + identifier); the API
// exposes it nested. The public UUID is named `id` in this contract.
const toDto = (row: CustomerRow): Customer => ({
  id: row.uuid,
  name: row.name,
  email: row.email ?? undefined,
  phone: row.phone,
  identifier: { type: row.type, value: row.identifier },
  billingAddress: row.billingAddress,
  shippingAddress: row.shippingAddress,
  notes: row.notes ?? undefined,
  isActive: row.isActive,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const findAll = async (companyId: number, page: number, limit: number) => {
  const [[{ total }], rows] = await Promise.all([
    db.select({ total: count() }).from(customers).where(eq(customers.companyId, companyId)),
    db
      .select()
      .from(customers)
      .where(eq(customers.companyId, companyId))
      .orderBy(customers.id)
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

export const findByUuid = async (companyId: number, uuid: string): Promise<Customer | null> => {
  const [row] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.uuid, uuid), eq(customers.companyId, companyId)))
    .limit(1);
  return row ? toDto(row) : null;
};

export const create = async (
  companyId: number,
  userId: number,
  dto: CreateCustomerDto,
): Promise<void> => {
  await db.insert(customers).values({
    companyId,
    name: dto.name,
    email: dto.email,
    phone: dto.phone,
    type: dto.type,
    identifier: dto.identifier,
    billingAddress: dto.billingAddress,
    shippingAddress: dto.shippingAddress,
    notes: dto.notes,
    isActive: dto.isActive,
    createdById: userId,
    updatedById: userId,
  });
};

export const update = async (
  companyId: number,
  userId: number,
  dto: UpdateCustomerDto,
): Promise<Customer | null> => {
  const changes: Partial<typeof customers.$inferInsert> = { updatedById: userId };
  if (dto.name !== undefined) changes.name = dto.name;
  if (dto.email !== undefined) changes.email = dto.email;
  if (dto.phone !== undefined) changes.phone = dto.phone;
  if (dto.billingAddress !== undefined) changes.billingAddress = dto.billingAddress;
  if (dto.shippingAddress !== undefined) changes.shippingAddress = dto.shippingAddress;
  if (dto.notes !== undefined) changes.notes = dto.notes;

  const [row] = await db
    .update(customers)
    .set(changes)
    .where(and(eq(customers.uuid, dto.uuid), eq(customers.companyId, companyId)))
    .returning();
  return row ? toDto(row) : null;
};

// Soft delete: invoices keep referencing the row; it just stops being active.
export const deactivate = async (companyId: number, uuid: string): Promise<string | null> => {
  const [row] = await db
    .update(customers)
    .set({ isActive: false })
    .where(and(eq(customers.uuid, uuid), eq(customers.companyId, companyId)))
    .returning({ uuid: customers.uuid });
  return row ? row.uuid : null;
};
