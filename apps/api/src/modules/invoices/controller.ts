import type { Request, Response } from 'express';
import { paginationQuerySchema } from '@serveless/shared/common';
import { createInvoiceSchema, updateInvoiceSchema } from '@serveless/shared/invoice';
import { CustomError } from '../../lib/errors.js';
import { toListResponse } from '../../lib/pagination.js';
import { deletePdf, presignPdf, putPdf } from '../../lib/s3.js';
import * as companiesRepository from '../companies/repository.js';
import * as customersRepository from '../customers/repository.js';
import * as repository from './repository.js';
import type { InvoiceChanges, NewInvoiceLine } from './repository.js';
import { buildInvoiceDocument } from './pdf/template.js';
import { renderPdf } from './pdf/render.js';

export const createInvoice = async (req: Request, res: Response) => {
  const { companyId, userId } = req.identity;
  const dto = createInvoiceSchema.parse(req.body);

  const customerId = await repository.resolveCustomerId(companyId, dto.customer);
  if (!customerId) throw CustomError.notFound('Customer not found');

  // All money is computed here — nothing about totals is trusted from the client.
  const lines: NewInvoiceLine[] = await Promise.all(
    dto.items.map(async (item) => {
      let itemId: number | null = null;
      if (item.product) {
        itemId = await repository.resolveItemId(companyId, item.product);
        if (!itemId) throw CustomError.notFound(`Product not found: ${item.product}`);
      }
      const lineTotal = Number(
        Math.max(item.quantity * item.unitPrice - item.discount, 0).toFixed(2),
      );
      return {
        itemId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        lineTotal,
      };
    }),
  );

  const subtotal = Number(lines.reduce((sum, l) => sum + l.lineTotal, 0).toFixed(2));
  const total = Number((subtotal + dto.tax - dto.discount).toFixed(2));
  if (total < 0) throw CustomError.badRequest('Total cannot be negative');

  await repository.create(
    companyId,
    userId,
    {
      customerId,
      status: dto.status,
      currency: dto.currency,
      issueDate: new Date(dto.issueDate),
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      subtotal,
      tax: dto.tax,
      discount: dto.discount,
      total,
      notes: dto.notes ?? null,
    },
    lines,
  );

  res.status(201).json('Invoice created successfully');
};

export const findAll = async (req: Request, res: Response) => {
  const { companyId } = req.identity;
  const { page, limit } = paginationQuerySchema.parse(req.query);

  const { data, pagination } = await repository.findAll(companyId, page, limit);
  res.json(toListResponse('invoices', data, pagination));
};

export const findById = async (req: Request<{ id: string }>, res: Response) => {
  const { companyId } = req.identity;

  const invoice = await repository.findByUuid(companyId, req.params.id);
  if (!invoice) throw CustomError.notFound('Invoice not found');
  res.json(invoice);
};

// Update is a status machine plus payment bookkeeping — an issued invoice's
// content (items, totals, customer) is immutable.
export const updateInvoice = async (req: Request<{ id: string }>, res: Response) => {
  const { companyId, userId } = req.identity;
  const dto = updateInvoiceSchema.parse({ ...req.body, uuid: req.params.id });

  const invoice = await repository.findRowByUuid(companyId, dto.uuid);
  if (!invoice) throw CustomError.notFound('Invoice not found');
  if (invoice.status === 'PAID' || invoice.status === 'CANCELED') {
    throw CustomError.badRequest('Cannot update a paid or canceled invoice');
  }

  const total = Number(invoice.total);
  const changes: InvoiceChanges = {};

  if (dto.notes !== undefined) changes.notes = dto.notes;

  if (dto.status !== undefined && dto.status !== invoice.status) {
    switch (dto.status) {
      case 'SENT':
        if (total <= 0) throw CustomError.badRequest('Cannot send invoice with zero total');
        changes.status = 'SENT';
        break;
      case 'OVERDUE':
        if (!invoice.dueDate) {
          throw CustomError.badRequest('Cannot mark as overdue without a due date');
        }
        if (invoice.dueDate.getTime() >= Date.now()) {
          throw CustomError.badRequest('Cannot mark as overdue before the due date');
        }
        changes.status = 'OVERDUE';
        break;
      case 'CANCELED':
        changes.status = 'CANCELED';
        break;
      case 'PAID':
        changes.status = 'PAID';
        changes.amountPaid = total.toFixed(2);
        changes.paymentDate = new Date();
        break;
      case 'PARTIALLY_PAID': {
        const amount = dto.amountPaid;
        if (amount === undefined || amount <= 0) {
          throw CustomError.badRequest('Amount paid is required for partial payment');
        }
        if (amount >= total) {
          throw CustomError.badRequest('Amount paid must be less than the total for a partial payment');
        }
        changes.status = 'PARTIALLY_PAID';
        changes.amountPaid = amount.toFixed(2);
        changes.paymentDate = new Date();
        break;
      }
      case 'DRAFT':
        throw CustomError.badRequest('Cannot revert an invoice back to draft');
    }
  }

  if (dto.paymentMethod !== undefined) changes.paymentMethod = dto.paymentMethod;
  if (dto.paymentNotes !== undefined) changes.paymentNotes = dto.paymentNotes;

  // A bare amountPaid (no status in the request) re-derives the status.
  if (dto.amountPaid !== undefined && dto.status === undefined) {
    changes.amountPaid = dto.amountPaid.toFixed(2);
    changes.paymentDate = new Date();
    if (dto.amountPaid >= total) changes.status = 'PAID';
    else if (dto.amountPaid > 0) changes.status = 'PARTIALLY_PAID';
  }

  await repository.applyChanges(companyId, dto.uuid, userId, changes);
  res.json({ message: 'Invoice updated successfully' });
};

// Regenerates the PDF on every call (same as Backend-main), overwrites the
// same S3 object, and answers with a short-lived presigned download link —
// the bucket itself is private.
export const generateInvoicePdf = async (req: Request<{ id: string }>, res: Response) => {
  const { companyId, companyUuid, userId } = req.identity;

  const invoice = await repository.findByUuid(companyId, req.params.id);
  if (!invoice) throw CustomError.notFound('Invoice not found');

  const [customer, company] = await Promise.all([
    customersRepository.findByUuid(companyId, invoice.customer),
    companiesRepository.findByUuid(userId, companyUuid),
  ]);
  if (!customer) throw CustomError.notFound('Customer not found');
  if (!company) throw CustomError.notFound('Company not found');

  const pdf = await renderPdf(buildInvoiceDocument(invoice, customer, company));

  // A draft is still mutable, so its PDF is never archived — hand the bytes
  // back directly and leave S3 untouched. Only issued invoices are stored.
  if (invoice.status === 'DRAFT') {
    res.json({ pdf: pdf.toString('base64') });
    return;
  }

  const key = `invoices/${companyUuid}/${invoice.id}.pdf`;
  await putPdf(key, pdf);
  await repository.savePdfKey(companyId, invoice.id, key);

  res.json({ url: await presignPdf(key) });
};

export const deleteInvoice = async (req: Request<{ id: string }>, res: Response) => {
  const { companyId } = req.identity;

  const invoice = await repository.findRowByUuid(companyId, req.params.id);
  if (!invoice) throw CustomError.notFound('Invoice not found');
  if (invoice.status !== 'DRAFT') {
    throw CustomError.badRequest('Only draft invoices can be deleted');
  }

  // S3 first: if this fails the invoice survives and the delete can be
  // retried; the reverse order would strand the object forever.
  if (invoice.pdfKey) await deletePdf(invoice.pdfKey);
  await repository.remove(companyId, req.params.id);
  res.json('Invoice deleted successfully');
};
