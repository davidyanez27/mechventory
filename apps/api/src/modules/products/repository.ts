import { and, count, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { CreateProductDto, Product, UpdateProductDto } from '@serveless/shared/product';
import { db } from '../../db/client.js';
import { items, users } from '../../db/schema/index.js';

// Joined twice: one alias resolves the creator's name, the other the last editor's.
const createdByUser = alias(users, 'created_by_user');
const updatedByUser = alias(users, 'updated_by_user');

const productColumns = {
  uuid: items.uuid,
  name: items.name,
  description: items.description,
  defaultPrice: items.defaultPrice,
  currency: items.currency,
  unit: items.unit,
  type: items.type,
  isActive: items.isActive,
  createdAt: items.createdAt,
  updatedAt: items.updatedAt,
  createdBy: createdByUser.fullName,
  updatedBy: updatedByUser.fullName,
};

type ProductRow = {
  uuid: string;
  name: string;
  description: string;
  defaultPrice: string;
  currency: string;
  unit: string;
  type: 'PRODUCT' | 'SERVICE';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
};

// Drizzle returns `numeric` columns as strings; the API contract is a number.
const toDto = (row: ProductRow): Product => ({
  uuid: row.uuid,
  name: row.name,
  description: row.description,
  defaultPrice: Number(row.defaultPrice),
  currency: row.currency,
  unit: row.unit,
  type: row.type,
  isActive: row.isActive,
  createdBy: row.createdBy ?? undefined,
  updatedBy: row.updatedBy ?? undefined,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const findAll = async (companyId: number, page: number, limit: number) => {
  const [[{ total }], rows] = await Promise.all([
    db.select({ total: count() }).from(items).where(eq(items.companyId, companyId)),
    db
      .select(productColumns)
      .from(items)
      .leftJoin(createdByUser, eq(items.createdById, createdByUser.id))
      .leftJoin(updatedByUser, eq(items.updatedById, updatedByUser.id))
      .where(eq(items.companyId, companyId))
      .orderBy(items.id)
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

export const findByUuid = async (companyId: number, uuid: string): Promise<Product | null> => {
  const [row] = await db
    .select(productColumns)
    .from(items)
    .leftJoin(createdByUser, eq(items.createdById, createdByUser.id))
    .leftJoin(updatedByUser, eq(items.updatedById, updatedByUser.id))
    .where(and(eq(items.uuid, uuid), eq(items.companyId, companyId)))
    .limit(1);
  return row ? toDto(row) : null;
};

// Returns the inserted row as-is; the controller fills createdBy/updatedBy
// from the caller's identity (the writer is always the current user).
export const create = async (companyId: number, userId: number, dto: CreateProductDto) => {
  const [row] = await db
    .insert(items)
    .values({
      companyId,
      name: dto.name,
      description: dto.description,
      defaultPrice: dto.defaultPrice.toFixed(2),
      currency: dto.currency,
      unit: dto.unit,
      type: dto.type,
      isActive: dto.isActive,
      createdById: userId,
      updatedById: userId,
    })
    .returning();
  return row;
};

export const update = async (companyId: number, userId: number, dto: UpdateProductDto) => {
  const changes: Partial<typeof items.$inferInsert> = { updatedById: userId };
  if (dto.name !== undefined) changes.name = dto.name;
  if (dto.description !== undefined) changes.description = dto.description;
  if (dto.defaultPrice !== undefined) changes.defaultPrice = dto.defaultPrice.toFixed(2);
  if (dto.currency !== undefined) changes.currency = dto.currency;
  if (dto.unit !== undefined) changes.unit = dto.unit;
  if (dto.type !== undefined) changes.type = dto.type;
  if (dto.isActive !== undefined) changes.isActive = dto.isActive;

  const [row] = await db
    .update(items)
    .set(changes)
    .where(and(eq(items.uuid, dto.uuid), eq(items.companyId, companyId)))
    .returning();
  return row ?? null;
};

// Soft delete: the row stays (invoices may reference it), it just stops
// being listed as active. Returns null when no such product exists.
export const deactivate = async (companyId: number, uuid: string): Promise<string | null> => {
  const [row] = await db
    .update(items)
    .set({ isActive: false })
    .where(and(eq(items.uuid, uuid), eq(items.companyId, companyId)))
    .returning({ uuid: items.uuid });
  return row ? row.uuid : null;
};

export type ItemRow = typeof items.$inferSelect;
