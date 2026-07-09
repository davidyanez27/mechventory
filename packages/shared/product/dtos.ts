import { z } from 'zod';
import { itemTypeSchema } from './types.js';

export const createProductSchema = z
  .object({
    name: z.string().min(1, 'Product name is required'),
    description: z.string().min(1, 'Product description is required'),
    defaultPrice: z.coerce.number().min(0, 'Default price must be 0 or greater'),
    currency: z.string().min(1, 'Currency is required'),
    unit: z.string().min(1, 'Unit is required'),
    type: itemTypeSchema,
    isActive: z.boolean().optional().default(true),
  })
  .strict();
export type CreateProductDto = z.infer<typeof createProductSchema>;

// Partial update. The target `uuid` travels in the body (Backend-main
// contract); everything else is optional with NO defaults so fields the
// caller didn't send are never overwritten.
export const updateProductSchema = z
  .object({
    uuid: z.uuid('Product uuid must be a valid UUID'),
    name: z.string().min(1, 'Product name cannot be empty').optional(),
    description: z.string().min(1, 'Product description cannot be empty').optional(),
    defaultPrice: z.coerce.number().min(0, 'Default price must be 0 or greater').optional(),
    currency: z.string().min(1, 'Currency cannot be empty').optional(),
    unit: z.string().min(1, 'Unit cannot be empty').optional(),
    type: itemTypeSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .strict();
export type UpdateProductDto = z.infer<typeof updateProductSchema>;
