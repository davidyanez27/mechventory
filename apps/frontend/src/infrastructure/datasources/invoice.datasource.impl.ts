import type { PaginationQuery } from '@serveless/shared/common';
import type { Invoice, CreateInvoiceDto, UpdateInvoiceDto, ListInvoices } from '@serveless/shared/invoice';
import type { InvoiceRepository } from '../../application';
import InventoryApi from '../api/api-client';

export class InvoiceDatasourceImpl implements InvoiceRepository {
  async getById(id: string): Promise<Invoice> {
    const { data } = await InventoryApi.get(`/invoices/find/${id}`);
    return data;
  }
  async getAll(options: PaginationQuery): Promise<ListInvoices> {
    const { data } = await InventoryApi.get(`/invoices/findAll`, {
      params: { page: options.page, limit: options.limit },
    });
    return data;
  }
  async post(dto: CreateInvoiceDto): Promise<Invoice> {
    const { data } = await InventoryApi.post(`/invoices/create`, dto);
    return data;
  }
  async put(id: string, dto: UpdateInvoiceDto): Promise<Invoice> {
    const { data } = await InventoryApi.put(`/invoices/update/${id}`, dto);
    return data;
  }
  async delete(id: string): Promise<Invoice> {
    const { data } = await InventoryApi.delete(`/invoices/delete/${id}`);
    return data;
  }
}
