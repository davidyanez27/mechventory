import { z } from 'zod';

export const companyTypeSchema = z.enum(['INDIVIDUAL', 'BUSINESS', 'ENTERPRISE']);
export type CompanyType = z.infer<typeof companyTypeSchema>;

export const companyRoleSchema = z.enum(['OWNER', 'ADMIN', 'MEMBER']);
export type CompanyRole = z.infer<typeof companyRoleSchema>;

// A company (workspace) as returned by the API. `id` is the public UUID.
// Fields the signup trigger can't know start as "PENDING" until the owner
// fills them in via update.
export const companySchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    companyType: companyTypeSchema,
    idType: z.string(),
    idValue: z.string(),
    currency: z.string(),
    address: z.string(),
    country: z.string(),
    phone: z.string(),
    email: z.email(),
    logo: z.string().nullable().optional(),
    isActive: z.boolean(),
  })
  .strict();
export type Company = z.infer<typeof companySchema>;
