import { z } from 'zod';
import { invoicePaymentMethodSchema, invoiceStatusSchema } from './types.js';

// A line item as sent by the client. lineTotal is NOT accepted — the server
// computes max(quantity * unitPrice - discount, 0).
export const createInvoiceItemSchema = z
  .object({
    product: z.uuid('Product must be a valid UUID').optional(),
    description: z.string().min(1, 'Description is required'),
    quantity: z.coerce.number().gt(0, 'Quantity must be greater than zero'),
    unitPrice: z.coerce.number().min(0, 'Unit price must be 0 or greater'),
    discount: z.coerce.number().min(0, 'Discount must be 0 or greater').optional().default(0),
  })
  .strict();
export type CreateInvoiceItemDto = z.infer<typeof createInvoiceItemSchema>;

// The customer is referenced by its public UUID. Totals are computed
// server-side; the invoice number comes from the per-company sequence.
export const createInvoiceSchema = z
  .object({
    customer: z.uuid('Customer must be a valid UUID'),
    status: invoiceStatusSchema.optional().default('DRAFT'),
    currency: z.string().min(1, 'Currency is required'),
    issueDate: z.iso.datetime(),
    dueDate: z.iso.datetime().optional(),
    tax: z.coerce.number().min(0, 'Tax must be 0 or greater'),
    discount: z.coerce.number().min(0, 'Discount must be 0 or greater'),
    notes: z.string().optional(),
    items: z.array(createInvoiceItemSchema).min(1, 'At least one item is required'),
  })
  .strict();
export type CreateInvoiceDto = z.infer<typeof createInvoiceSchema>;

// An issued invoice's content is immutable — update is a status machine plus
// payment bookkeeping and notes. (Backend-main's schema accepted more fields
// but never applied them; this schema is honest about what changes.)
export const updateInvoiceSchema = z
  .object({
    uuid: z.uuid('Invoice uuid must be a valid UUID'),
    status: invoiceStatusSchema.optional(),
    notes: z.string().nullable().optional(),
    amountPaid: z.coerce.number().min(0, 'Amount paid must be 0 or greater').optional(),
    paymentMethod: invoicePaymentMethodSchema.optional(),
    paymentNotes: z.string().nullable().optional(),
  })
  .strict();
export type UpdateInvoiceDto = z.infer<typeof updateInvoiceSchema>;
