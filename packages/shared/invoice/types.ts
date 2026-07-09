import { z } from 'zod';
import type { ListResponse } from '../common/types.js';

export const invoiceStatusSchema = z.enum([
  'DRAFT',
  'SENT',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'CANCELED',
]);
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

export const invoicePaymentMethodSchema = z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'OTHER']);
export type InvoicePaymentMethod = z.infer<typeof invoicePaymentMethodSchema>;

// A line item as returned by the API. `product` is the catalog item's UUID
// when the line came from the catalog; free-text lines have none.
export const invoiceItemSchema = z
  .object({
    product: z.uuid().optional(),
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    discount: z.number(),
    lineTotal: z.number(),
  })
  .strict();
export type InvoiceItem = z.infer<typeof invoiceItemSchema>;

// An invoice as returned by the API. `id` is the public UUID; `number` is the
// human-readable sequential number ("INV-0001"). All money is computed
// server-side and returned as numbers.
export const invoiceSchema = z
  .object({
    id: z.uuid(),
    number: z.string(),
    status: invoiceStatusSchema,
    currency: z.string(),
    issueDate: z.iso.datetime({ offset: true }),
    dueDate: z.iso.datetime({ offset: true }).optional(),
    subtotal: z.number(),
    tax: z.number(),
    discount: z.number(),
    total: z.number(),
    amountPaid: z.number(),
    paymentMethod: invoicePaymentMethodSchema,
    paymentNotes: z.string().optional(),
    notes: z.string().optional(),
    customer: z.uuid(),
    customerName: z.string(),
    items: z.array(invoiceItemSchema),
    isActive: z.boolean(),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .strict();
export type Invoice = z.infer<typeof invoiceSchema>;

export type ListInvoices = ListResponse<Invoice>;
