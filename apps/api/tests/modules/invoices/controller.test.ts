import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Identity } from '../../../src/middleware/identity.js';

const identityState = vi.hoisted(() => ({
  current: {
    userId: 1,
    userUuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    fullName: 'Owner One',
    companyId: 1,
    companyUuid: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    companyName: 'Test Workshop',
    companyRole: 'OWNER',
  },
}));

vi.mock('../../../src/middleware/identity.js', () => ({
  identityMiddleware: (req: Request, _res: Response, next: NextFunction) => {
    req.identity = identityState.current as Identity;
    next();
  },
}));

vi.mock('../../../src/modules/invoices/repository.js', () => ({
  findAll: vi.fn(),
  findByUuid: vi.fn(),
  findRowByUuid: vi.fn(),
  resolveCustomerId: vi.fn(),
  resolveItemId: vi.fn(),
  create: vi.fn(),
  applyChanges: vi.fn(),
  savePdfKey: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('../../../src/modules/customers/repository.js', () => ({
  findAll: vi.fn(),
  findByUuid: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  deactivate: vi.fn(),
}));

vi.mock('../../../src/modules/companies/repository.js', () => ({
  findAll: vi.fn(),
  findByUuid: vi.fn(),
  update: vi.fn(),
  emailTaken: vi.fn(),
  addMember: vi.fn(),
}));

vi.mock('../../../src/lib/s3.js', () => ({
  putPdf: vi.fn(),
  presignPdf: vi.fn(),
  deletePdf: vi.fn(),
}));

vi.mock('../../../src/modules/invoices/pdf/render.js', () => ({
  renderPdf: vi.fn(),
}));

vi.mock('../../../src/modules/invoices/pdf/template.js', () => ({
  buildInvoiceDocument: vi.fn(),
}));

import { app } from '../../../src/app.js';
import { deletePdf, presignPdf, putPdf } from '../../../src/lib/s3.js';
import * as companiesRepository from '../../../src/modules/companies/repository.js';
import * as customersRepository from '../../../src/modules/customers/repository.js';
import { renderPdf } from '../../../src/modules/invoices/pdf/render.js';
import * as repository from '../../../src/modules/invoices/repository.js';

const CUSTOMER_UUID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const INVOICE_UUID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

const createPayload = {
  customer: CUSTOMER_UUID,
  currency: 'USD',
  issueDate: '2026-07-05T00:00:00.000Z',
  tax: 20,
  discount: 5,
  items: [
    { description: 'Brake job', quantity: 2, unitPrice: 100, discount: 10 },
    { description: 'Oil change', quantity: 1, unitPrice: 50 },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /invoices/create', () => {
  test('should compute all money server-side and never trust client totals', async () => {
    vi.mocked(repository.resolveCustomerId).mockResolvedValue(10);
    vi.mocked(repository.create).mockResolvedValue(INVOICE_UUID);
    const response = await request(app).post('/invoices/create').send(createPayload);

    expect(response.status).toBe(201);
    // lines: 2*100-10 = 190 and 1*50 = 50 → subtotal 240 → total 240+20-5 = 255
    expect(repository.create).toHaveBeenCalledWith(
      1,
      1,
      expect.objectContaining({ subtotal: 240, total: 255, status: 'DRAFT' }),
      [
        expect.objectContaining({ description: 'Brake job', lineTotal: 190 }),
        expect.objectContaining({ description: 'Oil change', lineTotal: 50 }),
      ],
    );
  });

  test('should reject a negative total', async () => {
    vi.mocked(repository.resolveCustomerId).mockResolvedValue(10);

    const response = await request(app)
      .post('/invoices/create')
      .send({
        ...createPayload,
        tax: 0,
        discount: 1000,
      });

    expect(response.status).toBe(400);
    expect(repository.create).not.toHaveBeenCalled();
  });

  test('should answer 404 when the customer does not belong to the company', async () => {
    vi.mocked(repository.resolveCustomerId).mockResolvedValue(null);

    const response = await request(app).post('/invoices/create').send(createPayload);

    expect(response.status).toBe(404);
    expect(repository.create).not.toHaveBeenCalled();
  });
});

describe('GET /invoices/pdf/:id', () => {
  const invoice = (status: string) =>
    ({
      id: INVOICE_UUID,
      status,
      customer: CUSTOMER_UUID,
    }) as Awaited<ReturnType<typeof repository.findByUuid>>;

  const stubPdfCollaborators = () => {
    vi.mocked(customersRepository.findByUuid).mockResolvedValue(
      {} as Awaited<ReturnType<typeof customersRepository.findByUuid>>,
    );
    vi.mocked(companiesRepository.findByUuid).mockResolvedValue(
      {} as Awaited<ReturnType<typeof companiesRepository.findByUuid>>,
    );
    vi.mocked(renderPdf).mockResolvedValue(Buffer.from('PDF-BYTES'));
  };

  test('should hand a draft back as base64 and leave S3 untouched', async () => {
    vi.mocked(repository.findByUuid).mockResolvedValue(invoice('DRAFT'));
    stubPdfCollaborators();

    const response = await request(app).get(`/invoices/pdf/${INVOICE_UUID}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ pdf: Buffer.from('PDF-BYTES').toString('base64') });
    expect(putPdf).not.toHaveBeenCalled();
    expect(repository.savePdfKey).not.toHaveBeenCalled();
  });

  test('should archive an issued invoice in S3 and answer a presigned link', async () => {
    vi.mocked(repository.findByUuid).mockResolvedValue(invoice('SENT'));
    stubPdfCollaborators();
    vi.mocked(presignPdf).mockResolvedValue('https://signed.example/pdf');

    const response = await request(app).get(`/invoices/pdf/${INVOICE_UUID}`);
    const expectedKey = `invoices/${identityState.current.companyUuid}/${INVOICE_UUID}.pdf`;

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ url: 'https://signed.example/pdf' });
    expect(putPdf).toHaveBeenCalledWith(expectedKey, Buffer.from('PDF-BYTES'));
    expect(repository.savePdfKey).toHaveBeenCalledWith(1, INVOICE_UUID, expectedKey);
  });
});

describe('DELETE /invoices/delete/:id', () => {
  test('should delete the S3 object before the row so a failure stays retryable', async () => {
    vi.mocked(repository.findRowByUuid).mockResolvedValue({
      status: 'DRAFT',
      pdfKey: 'invoices/legacy.pdf',
    } as Awaited<ReturnType<typeof repository.findRowByUuid>>);

    const response = await request(app).delete(`/invoices/delete/${INVOICE_UUID}`);

    expect(response.status).toBe(200);
    expect(deletePdf).toHaveBeenCalledWith('invoices/legacy.pdf');
    expect(repository.remove).toHaveBeenCalledWith(1, INVOICE_UUID);
    const deleteOrder = vi.mocked(deletePdf).mock.invocationCallOrder[0];
    const removeOrder = vi.mocked(repository.remove).mock.invocationCallOrder[0];
    expect(deleteOrder).toBeLessThan(removeOrder);
  });

  test('should only ever delete drafts', async () => {
    vi.mocked(repository.findRowByUuid).mockResolvedValue({
      status: 'PAID',
      pdfKey: 'invoices/kept.pdf',
    } as Awaited<ReturnType<typeof repository.findRowByUuid>>);

    const response = await request(app).delete(`/invoices/delete/${INVOICE_UUID}`);

    expect(response.status).toBe(400);
    expect(deletePdf).not.toHaveBeenCalled();
    expect(repository.remove).not.toHaveBeenCalled();
  });
});
