import { z } from 'zod';
import { companyRoleSchema } from '../company/types';
import type { ListResponse } from '../common/types';

// A workspace member as returned by the users API. `companyRole` comes from
// the membership row, not the user itself.
export const userSchema = z
  .object({
    uuid: z.uuid(),
    email: z.email(),
    fullName: z.string(),
    companyRole: companyRoleSchema,
    isActive: z.boolean(),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .strict();
export type User = z.infer<typeof userSchema>;

export type ListUsers = ListResponse<User>;

// GET /users/me — the member schema minus the membership role, plus the slim
// company context the API attaches (the full company DTO comes from
// /companies/find/:id).
export const meSchema = userSchema.omit({ companyRole: true }).extend({
  company: z
    .object({
      uuid: z.uuid(),
      name: z.string(),
      role: companyRoleSchema,
    })
    .strict(),
});
export type Me = z.infer<typeof meSchema>;

// POST /companies/invite — an invite is a future member, so it reuses the
// member schema; OWNER is unique per workspace and can never be granted.
export const inviteMemberSchema = userSchema
  .pick({ email: true, fullName: true })
  .extend({ role: companyRoleSchema.exclude(['OWNER']) });
export type InviteMemberDto = z.infer<typeof inviteMemberSchema>;
