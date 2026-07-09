import type { CreateInvoiceDto, Invoice } from '@serveless/shared/invoice';
import type { InvoiceRepository } from '../../repositories';

export class CreateInvoice {
  constructor(private readonly repository: InvoiceRepository) {}
  async execute(dto: CreateInvoiceDto): Promise<Invoice> {
    return this.repository.post(dto);
  }
}
