import { z } from 'zod';
import type { ListResponse } from '../common/types.js';

// PRODUCT is a physical good; SERVICE is billed work (labor, repairs).
export const itemTypeSchema = z.enum(['PRODUCT', 'SERVICE']);
export type ItemType = z.infer<typeof itemTypeSchema>;

// A catalog product/service as returned by the API. `uuid` is the public
// handle used in URLs; the numeric DB id never leaves the backend.
export const productSchema = z.object({
  uuid: z.uuid(),
  name: z.string(),
  description: z.string(),
  defaultPrice: z.number(),
  currency: z.string(),
  unit: z.string(),
  type: itemTypeSchema,
  isActive: z.boolean(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  createdAt: z.iso.datetime({ offset: true }).optional(),
  updatedAt: z.iso.datetime({ offset: true }).optional(),
});
export type Product = z.infer<typeof productSchema>;

export type ListProducts = ListResponse<Product>;
