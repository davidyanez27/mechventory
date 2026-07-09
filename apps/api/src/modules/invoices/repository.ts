import { and, count, desc, eq, inArray, sql } from 'drizzle-orm';
import type { Invoice, InvoiceItem } from '@serveless/shared/invoice';
import { db } from '../../db/client.js';
import { customers, invoiceItems, invoiceSequences, invoices, items } from '../../db/schema/index.js';

export type InvoiceRow = typeof invoices.$inferSelect;

// Money/quantity columns are `numeric` — strings in, strings out of Drizzle.
// The API contract is numbers, so conversion happens here at the edge.
type ItemRowWithProduct = {
  invoiceId: number;
  productUuid: string | null;
  description: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  lineTotal: string;
};

const itemToDto = (row: ItemRowWithProduct): InvoiceItem => ({
  product: row.productUuid ?? undefined,
  description: row.description,
  quantity: Number(row.quantity),
  unitPrice: Number(row.unitPrice),
  discount: Number(row.discount),
  lineTotal: Number(row.lineTotal),
});

const toDto = (
  row: InvoiceRow,
  customer: { uuid: string; name: string },
  lineItems: InvoiceItem[],
): Invoice => ({
  id: row.uuid,
  number: row.number,
  status: row.status,
  currency: row.currency,
  issueDate: row.issueDate.toISOString(),
  dueDate: row.dueDate?.toISOString(),
  subtotal: Number(row.subtotal),
  tax: Number(row.tax),
  discount: Number(row.discount),
  total: Number(row.total),
  amountPaid: Number(row.amountPaid),
  paymentMethod: row.paymentMethod,
  paymentNotes: row.paymentNotes ?? undefined,
  notes: row.notes ?? undefined,
  customer: customer.uuid,
  customerName: customer.name,
  items: lineItems,
  isActive: row.isActive,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

// Line items for a page of invoices in one query, grouped by invoice id.
const loadItems = async (invoiceIds: number[]): Promise<Map<number, InvoiceItem[]>> => {
  const grouped = new Map<number, InvoiceItem[]>();
  if (invoiceIds.length === 0) return grouped;

  const rows = await db
    .select({
      invoiceId: invoiceItems.invoiceId,
      productUuid: items.uuid,
      description: invoiceItems.description,
      quantity: invoiceItems.quantity,
      unitPrice: invoiceItems.unitPrice,
      discount: invoiceItems.discount,
      lineTotal: invoiceItems.lineTotal,
    })
    .from(invoiceItems)
    .leftJoin(items, eq(invoiceItems.itemId, items.id))
    .where(inArray(invoiceItems.invoiceId, invoiceIds))
    .orderBy(invoiceItems.id);

  for (const row of rows) {
    const list = grouped.get(row.invoiceId) ?? [];
    list.push(itemToDto(row));
    grouped.set(row.invoiceId, list);
  }
  return grouped;
};

export const findAll = async (companyId: number, page: number, limit: number) => {
  const [[{ total }], rows] = await Promise.all([
    db.select({ total: count() }).from(invoices).where(eq(invoices.companyId, companyId)),
    db
      .select({ invoice: invoices, customerUuid: customers.uuid, customerName: customers.name })
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .where(eq(invoices.companyId, companyId))
      .orderBy(desc(invoices.id))
      .limit(limit)
      .offset((page - 1) * limit),
  ]);

  const itemsByInvoice = await loadItems(rows.map((r) => r.invoice.id));

  return {
    data: rows.map((r) =>
      toDto(
        r.invoice,
        { uuid: r.customerUuid, name: r.customerName },
        itemsByInvoice.get(r.invoice.id) ?? [],
      ),
    ),
    pagination: {
      page,
      limit,
      total,
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

export const findByUuid = async (companyId: number, uuid: string): Promise<Invoice | null> => {
  const [row] = await db
    .select({ invoice: invoices, customerUuid: customers.uuid, customerName: customers.name })
    .from(invoices)
    .innerJoin(customers, eq(invoices.customerId, customers.id))
    .where(and(eq(invoices.uuid, uuid), eq(invoices.companyId, companyId)))
    .limit(1);
  if (!row) return null;

  const itemsByInvoice = await loadItems([row.invoice.id]);
  return toDto(
    row.invoice,
    { uuid: row.customerUuid, name: row.customerName },
    itemsByInvoice.get(row.invoice.id) ?? [],
  );
};

// Raw row (no joins) for the update/delete rules that need current status.
export const findRowByUuid = async (companyId: number, uuid: string): Promise<InvoiceRow | null> => {
  const [row] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.uuid, uuid), eq(invoices.companyId, companyId)))
    .limit(1);
  return row ?? null;
};

export const resolveCustomerId = async (companyId: number, uuid: string): Promise<number | null> => {
  const [row] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.uuid, uuid), eq(customers.companyId, companyId)))
    .limit(1);
  return row ? row.id : null;
};

export const resolveItemId = async (companyId: number, uuid: string): Promise<number | null> => {
  const [row] = await db
    .select({ id: items.id })
    .from(items)
    .where(and(eq(items.uuid, uuid), eq(items.companyId, companyId)))
    .limit(1);
  return row ? row.id : null;
};

export type NewInvoiceLine = {
  itemId: number | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
};

export type NewInvoiceValues = {
  customerId: number;
  status: InvoiceRow['status'];
  currency: string;
  issueDate: Date;
  dueDate: Date | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes: string | null;
};

// One transaction: claim the next per-company number (atomic upsert — the row
// lock serializes concurrent creates), insert the invoice, insert its lines.
export const create = async (
  companyId: number,
  userId: number,
  values: NewInvoiceValues,
  lines: NewInvoiceLine[],
): Promise<string> => {
  return db.transaction(async (tx) => {
    const [seq] = await tx
      .insert(invoiceSequences)
      .values({ companyId, current: 1 })
      .onConflictDoUpdate({
        target: invoiceSequences.companyId,
        set: { current: sql`${invoiceSequences.current} + 1` },
      })
      .returning();

    const number = `${seq.prefix}-${String(seq.current).padStart(4, '0')}${seq.suffix}`;

    const [invoice] = await tx
      .insert(invoices)
      .values({
        companyId,
        customerId: values.customerId,
        number,
        status: values.status,
        currency: values.currency,
        issueDate: values.issueDate,
        dueDate: values.dueDate,
        subtotal: values.subtotal.toFixed(2),
        tax: values.tax.toFixed(2),
        discount: values.discount.toFixed(2),
        total: values.total.toFixed(2),
        paymentMethod: 'CASH',
        notes: values.notes,
        createdById: userId,
        updatedById: userId,
      })
      .returning({ id: invoices.id, number: invoices.number });

    await tx.insert(invoiceItems).values(
      lines.map((line) => ({
        invoiceId: invoice.id,
        itemId: line.itemId,
        description: line.description,
        quantity: line.quantity.toFixed(3),
        unitPrice: line.unitPrice.toFixed(2),
        discount: line.discount.toFixed(2),
        lineTotal: line.lineTotal.toFixed(2),
      })),
    );

    return invoice.number;
  });
};

export type InvoiceChanges = Partial<{
  status: InvoiceRow['status'];
  notes: string | null;
  amountPaid: string;
  paymentDate: Date;
  paymentMethod: InvoiceRow['paymentMethod'];
  paymentNotes: string | null;
}>;

export const applyChanges = async (
  companyId: number,
  uuid: string,
  userId: number,
  changes: InvoiceChanges,
): Promise<void> => {
  await db
    .update(invoices)
    .set({ ...changes, updatedById: userId })
    .where(and(eq(invoices.uuid, uuid), eq(invoices.companyId, companyId)));
};

// Each regeneration overwrites the same S3 object, so the key is stable —
// but persisting it records that a PDF exists for this invoice.
export const savePdfKey = async (companyId: number, uuid: string, key: string): Promise<void> => {
  await db
    .update(invoices)
    .set({ pdfKey: key })
    .where(and(eq(invoices.uuid, uuid), eq(invoices.companyId, companyId)));
};

// Hard delete — only ever called for DRAFTs; invoice_items cascade.
export const remove = async (companyId: number, uuid: string): Promise<void> => {
  await db
    .delete(invoices)
    .where(and(eq(invoices.uuid, uuid), eq(invoices.companyId, companyId)));
};
