import { boolean, index, integer, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { companyRoleEnum, companyTypeEnum } from './enums.js';
import { createdAt, id, publicUuid, updatedAt } from './helpers.js';

export const users = pgTable('users', {
  id: id(),
  uuid: publicUuid(),
  cognitoSub: text('cognito_sub').notNull().unique(),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const companies = pgTable('companies', {
  id: id(),
  uuid: publicUuid(),
  // Workspace names are globally unique; the post-confirmation trigger
  // suffixes on collision ("Juan's workspace 2").
  name: text('name').notNull().unique(),
  companyType: companyTypeEnum('company_type').default('INDIVIDUAL').notNull(),
  idType: text('id_type').default('PENDING').notNull(),
  idValue: text('id_value').default('PENDING').notNull(),
  email: text('email').notNull(),
  phone: text('phone').default('PENDING').notNull(),
  address: text('address').default('PENDING').notNull(),
  country: text('country').default('US').notNull(),
  currency: text('currency').default('USD').notNull(),
  logo: text('logo'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const companyMembers = pgTable(
  'company_members',
  {
    id: id(),
    uuid: publicUuid(),
    companyRole: companyRoleEnum('company_role').default('MEMBER').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    companyId: integer('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('company_members_company_id_user_id_key').on(t.companyId, t.userId),
    index('company_members_company_id_idx').on(t.companyId),
    index('company_members_user_id_idx').on(t.userId),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type CompanyMember = typeof companyMembers.$inferSelect;
export type NewCompanyMember = typeof companyMembers.$inferInsert;
