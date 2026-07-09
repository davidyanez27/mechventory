import { z } from 'zod';

// The only user field editable through this API is the display name.
// Credentials/email live in Cognito, roles in the membership.
export const updateUserSchema = z
  .object({
    uuid: z.uuid('User uuid must be a valid UUID'),
    fullName: z.string().min(1, 'Full name cannot be empty'),
  })
  .strict();
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
