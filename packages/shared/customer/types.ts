import { z } from 'zod';
import type { ListResponse } from '../common/types.js';

// Free-form identifier: the type is user-defined ("DNI", "RUC", "WALK-IN"…).
// Stored flat in the DB (type_identifier + identifier columns) but exposed
// as a nested object — Backend-main contract.
export const customerIdentifierSchema = z
  .object({
    type: z.string().min(1, 'Identifier type is required'),
    value: z.string().min(1, 'Identifier value is required'),
  })
  .strict();
export type CustomerIdentifier = z.infer<typeof customerIdentifierSchema>;

// A customer as returned by the API. Note the public UUID is named `id`
// here (products call it `uuid`) — kept as-is from Backend-main.
export const customerSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    email: z.email().optional(),
    phone: z.string(),
    identifier: customerIdentifierSchema,
    billingAddress: z.string(),
    shippingAddress: z.string(),
    notes: z.string().optional(),
    isActive: z.boolean(),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .strict();
export type Customer = z.infer<typeof customerSchema>;

export type ListCustomers = ListResponse<Customer>;
