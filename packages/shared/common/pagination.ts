import { z } from 'zod';

// Query-string pagination: strings come in from the URL, numbers come out
// (`coerce`). Every domain's findAll parses its query through this.
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
export type PaginationQueryDto = z.infer<typeof paginationQuerySchema>;
