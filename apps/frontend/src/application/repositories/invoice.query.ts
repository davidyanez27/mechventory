import type { PaginationQuery } from '@serveless/shared/common';
import type { Invoice, CreateInvoiceDto, UpdateInvoiceDto, ListInvoices } from '@serveless/shared/invoice';

export abstract class InvoiceRepository {
  abstract getById(id: string): Promise<Invoice>;
  abstract getAll(options: PaginationQuery): Promise<ListInvoices>;
  abstract post(dto: CreateInvoiceDto): Promise<Invoice>;
  abstract put(id: string, dto: UpdateInvoiceDto): Promise<Invoice>;
  abstract delete(id: string): Promise<Invoice>;
}
