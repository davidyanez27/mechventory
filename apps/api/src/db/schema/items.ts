import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { companies, users } from './core.js';
import { itemTypeEnum } from './enums.js';
import { createdAt, id, publicUuid, updatedAt } from './helpers.js';

export const items = pgTable(
  'items',
  {
    id: id(),
    uuid: publicUuid(),
    companyId: integer('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description').notNull(),
    type: itemTypeEnum('type').default('PRODUCT').notNull(),
    unit: text('unit').default('unit').notNull(),
    defaultPrice: numeric('default_price', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').default('USD').notNull(),
    trackInventory: boolean('track_inventory').default(false).notNull(),
    createdById: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
    updatedById: integer('updated_by').references(() => users.id, { onDelete: 'set null' }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('items_company_id_name_type_key').on(t.companyId, t.name, t.type),
    index('items_company_id_type_idx').on(t.companyId, t.type),
  ],
);

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
