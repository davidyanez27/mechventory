import { boolean, index, integer, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { companies, users } from './core.js';
import { createdAt, id, publicUuid, updatedAt } from './helpers.js';

export const customers = pgTable(
  'customers',
  {
    id: id(),
    uuid: publicUuid(),
    companyId: integer('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone').notNull(),
    billingAddress: text('billing_address').notNull(),
    shippingAddress: text('shipping_address').notNull(),
    notes: text('notes'),
    type: text('type_identifier').notNull(),
    identifier: text('identifier').notNull(),
    createdById: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
    updatedById: integer('updated_by').references(() => users.id, { onDelete: 'set null' }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('customers_company_id_email_key').on(t.companyId, t.email),
    index('customers_company_id_idx').on(t.companyId),
    index('customers_company_id_is_active_idx').on(t.companyId, t.isActive),
    index('customers_company_id_type_idx').on(t.companyId, t.type),
    index('customers_email_idx').on(t.email),
  ],
);

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
