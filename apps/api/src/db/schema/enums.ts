import { pgEnum } from 'drizzle-orm/pg-core';

export const companyRoleEnum = pgEnum('company_role', ['OWNER', 'ADMIN', 'MEMBER']);
export type CompanyRole = (typeof companyRoleEnum.enumValues)[number];

export const companyTypeEnum = pgEnum('company_type', ['INDIVIDUAL', 'BUSINESS', 'ENTERPRISE']);
export type CompanyType = (typeof companyTypeEnum.enumValues)[number];

export const itemTypeEnum = pgEnum('item_type', ['PRODUCT', 'SERVICE']);
export type ItemType = (typeof itemTypeEnum.enumValues)[number];

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'DRAFT',
  'SENT',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'CANCELED',
]);
export type InvoiceStatus = (typeof invoiceStatusEnum.enumValues)[number];

export const invoiceTermsEnum = pgEnum('invoice_terms', [
  'NET_15',
  'NET_30',
  'NET_45',
  'NET_60',
  'DUE_ON_RECEIPT',
  'CUSTOM',
]);
export type InvoiceTerms = (typeof invoiceTermsEnum.enumValues)[number];

export const invoicePaymentMethodEnum = pgEnum('invoice_payment_method', [
  'CASH',
  'CARD',
  'BANK_TRANSFER',
  'OTHER',
]);
export type InvoicePaymentMethod = (typeof invoicePaymentMethodEnum.enumValues)[number];
