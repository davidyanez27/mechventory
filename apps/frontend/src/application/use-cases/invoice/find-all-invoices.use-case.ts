import type { PaginationQuery } from '@serveless/shared/common';
import type { ListInvoices } from '@serveless/shared/invoice';
import type { InvoiceRepository } from '../../repositories';

export class FindAllInvoices {
  constructor(private readonly repository: InvoiceRepository) {}
  async execute(options: PaginationQuery): Promise<ListInvoices> {
    return this.repository.getAll(options);
  }
}
