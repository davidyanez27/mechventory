import type { Invoice } from '@serveless/shared/invoice';
import type { InvoiceRepository } from '../../repositories';

export class FindInvoice {
  constructor(private readonly repository: InvoiceRepository) {}
  async execute(id: string): Promise<Invoice> {
    return this.repository.getById(id);
  }
}
