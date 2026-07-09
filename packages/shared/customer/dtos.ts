import { z } from 'zod';

export const createCustomerSchema = z
  .object({
    name: z.string().min(1, 'Customer name is required'),
    type: z.string().min(1, 'Identifier type is required'),
    identifier: z.string().min(1, 'Identifier value is required'),
    email: z.email('Email must be a valid email').trim().toLowerCase(),
    phone: z.string().min(1, 'Phone is required'),
    billingAddress: z.string().min(1, 'Billing address is required'),
    shippingAddress: z.string().min(1, 'Shipping address is required'),
    notes: z.string().min(1, 'Notes cannot be empty').optional(),
    isActive: z.boolean().optional().default(true),
  })
  .strict();
export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;

// Partial update; `uuid` is the target. Only these fields are applied —
// the identifier is immutable after creation (Backend-main behavior).
export const updateCustomerSchema = z
  .object({
    uuid: z.uuid('Customer uuid must be a valid UUID'),
    name: z.string().min(1, 'Customer name cannot be empty').optional(),
    email: z.email('Email must be a valid email').trim().toLowerCase().optional(),
    phone: z.string().min(1, 'Phone cannot be empty').optional(),
    billingAddress: z.string().min(1, 'Billing address cannot be empty').optional(),
    shippingAddress: z.string().min(1, 'Shipping address cannot be empty').optional(),
    notes: z.string().min(1, 'Notes cannot be empty').optional(),
  })
  .strict();
export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;
