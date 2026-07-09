import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { companies, users } from './core.js';
import { customers } from './customers.js';
import { invoicePaymentMethodEnum, invoiceStatusEnum, invoiceTermsEnum } from './enums.js';
import { createdAt, id, publicUuid, updatedAt } from './helpers.js';
import { items } from './items.js';

export const invoiceSequences = pgTable('invoice_sequences', {
  id: id(),
  companyId: integer('company_id')
    .notNull()
    .unique()
    .references(() => companies.id, { onDelete: 'cascade' }),
  current: integer('current').default(1).notNull(),
  prefix: text('prefix').default('INV').notNull(),
  suffix: text('suffix').default('').notNull(),
});

export const invoices = pgTable(
  'invoices',
  {
    id: id(),
    uuid: publicUuid(),
    companyId: integer('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    customerId: integer('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    number: text('number').notNull(),
    status: invoiceStatusEnum('status').default('DRAFT').notNull(),
    currency: text('currency').default('USD').notNull(),
    issueDate: timestamp('issue_date', { withTimezone: true, mode: 'date' }).notNull(),
    dueDate: timestamp('due_date', { withTimezone: true, mode: 'date' }),
    subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
    tax: numeric('tax', { precision: 12, scale: 2 }).default('0').notNull(),
    discount: numeric('discount', { precision: 12, scale: 2 }).default('0').notNull(),
    total: numeric('total', { precision: 12, scale: 2 }).notNull(),
    paymentTerms: invoiceTermsEnum('payment_terms').default('NET_30').notNull(),
    customTerms: text('custom_terms'),
    amountPaid: numeric('amount_paid', { precision: 12, scale: 2 }).default('0').notNull(),
    paymentMethod: invoicePaymentMethodEnum('payment_method').notNull(),
    paymentDate: timestamp('payment_date', { withTimezone: true, mode: 'date' }),
    paymentNotes: text('payment_notes'),
    notes: text('notes'),
    pdfKey: text('pdf_key'),
    createdById: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
    updatedById: integer('updated_by').references(() => users.id, { onDelete: 'set null' }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('invoices_company_id_number_key').on(t.companyId, t.number),
    index('invoices_company_id_idx').on(t.companyId),
    index('invoices_customer_id_idx').on(t.customerId),
    index('invoices_company_id_status_issue_date_idx').on(t.companyId, t.status, t.issueDate),
    index('invoices_customer_id_status_idx').on(t.customerId, t.status),
  ],
);

export const invoiceItems = pgTable(
  'invoice_items',
  {
    id: id(),
    uuid: publicUuid(),
    invoiceId: integer('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    itemId: integer('item_id').references(() => items.id, { onDelete: 'set null' }),
    description: text('description').notNull(),
    quantity: numeric('quantity', { precision: 12, scale: 3 }).default('1').notNull(),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
    discount: numeric('discount', { precision: 12, scale: 2 }).default('0').notNull(),
    lineTotal: numeric('line_total', { precision: 12, scale: 2 }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('invoice_items_invoice_id_idx').on(t.invoiceId),
    index('invoice_items_item_id_idx').on(t.itemId),
  ],
);

export type InvoiceSequence = typeof invoiceSequences.$inferSelect;
export type NewInvoiceSequence = typeof invoiceSequences.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;
