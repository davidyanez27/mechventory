import axios from 'axios';
import type { PaginationQuery } from '@serveless/shared/common';
import type { InvoiceStatus } from '@serveless/shared/invoice';

/* ─── Error message extractor ───────────────────────────────────────────────── */

export const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.detail ?? err.response?.data?.message ?? err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
};

/* ─── Shared date formatter ─────────────────────────────────────────────────── */

export const fmt = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

/* ─── Invoice status ─────────────────────────────────────────────────────────── */

export const INVOICE_STATUSES: InvoiceStatus[] = [
  'DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELED',
];

export type BadgeColor = 'light' | 'info' | 'warning' | 'success' | 'error' | 'primary';

export const STATUS_COLOR: Record<InvoiceStatus, BadgeColor> = {
  DRAFT:         'light',
  SENT:          'info',
  PARTIALLY_PAID:'warning',
  PAID:          'success',
  OVERDUE:       'error',
  CANCELED:      'light',
};

export const STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT:          'Draft',
  SENT:           'Sent',
  PARTIALLY_PAID: 'Partially Paid',
  PAID:           'Paid',
  OVERDUE:        'Overdue',
  CANCELED:       'Canceled',
};

/* ─── Product constants ─────────────────────────────────────────────────────── */

export type ProductType = 'PRODUCT' | 'SERVICE';

export const PRODUCT_TYPES: ProductType[] = ['PRODUCT', 'SERVICE'];

export const PRODUCT_TYPE_COLOR: Record<ProductType, BadgeColor> = {
  PRODUCT: 'primary',
  SERVICE: 'info',
};

export type ProductFormState = {
  name: string;
  description: string;
  defaultPrice: string;
  currency: string;
  unit: string;
  type: ProductType;
};

export const EMPTY_PRODUCT_FORM: ProductFormState = {
  name: '',
  description: '',
  defaultPrice: '',
  currency: 'USD',
  unit: 'unit',
  type: 'PRODUCT',
};

/* ─── Customer constants ────────────────────────────────────────────────────── */

export type CustomerFormState = {
  name: string;
  email: string;
  phone: string;
  type: string;
  identifier: string;
  billingAddress: string;
  shippingAddress: string;
  notes: string;
};

export const EMPTY_CUSTOMER_FORM: CustomerFormState = {
  name: '',
  email: '',
  phone: '',
  type: 'DNI',
  identifier: '',
  billingAddress: '',
  shippingAddress: '',
  notes: '',
};

/* ─── Shared pagination defaults ────────────────────────────────────────────── */

export const ALL_ACTIVE: PaginationQuery = {
  page: 1, limit: 100, search: '', sortBy: '', sortOrder: 'asc', status: 'active',
};

export const FIRST_PAGE: PaginationQuery = {
  page: 1, limit: 5, search: '', sortBy: '', sortOrder: 'asc', status: 'active',
};

/* ─── File upload constraints ───────────────────────────────────────────────── */

export const MAX_LOGO_SIZE_BYTES = 20 * 1024; // 20 KB — matches @db.Text logo field
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/* ─── Shared CSS classes ────────────────────────────────────────────────────── */

export const SELECT_CLASS =
  'w-full h-11 rounded-lg border border-gray-300 dark:border-border bg-transparent px-4 text-sm text-gray-800 dark:text-foreground focus:outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:focus:border-brand-500';

/* ─── Line item default ─────────────────────────────────────────────────────── */

export type LineItem = {
  description: string;
  quantity:    string;
  unitPrice:   string;
  discount:    string;
  product:     string;
};

export const EMPTY_LINE: LineItem = {
  description: '', quantity: '1', unitPrice: '0.00', discount: '0', product: '',
};

export const lineTotal = (it: LineItem): number => {
  const qty   = parseFloat(it.quantity)  || 0;
  const price = parseFloat(it.unitPrice) || 0;
  const disc  = parseFloat(it.discount)  || 0;
  return qty * price * (1 - disc / 100);
};
