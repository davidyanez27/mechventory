import type { UpdateInvoiceDto, Invoice } from '@serveless/shared/invoice';
import type { InvoiceRepository } from '../../repositories';

export class UpdateInvoice {
  constructor(private readonly repository: InvoiceRepository) {}
  async execute(id: string, dto: UpdateInvoiceDto): Promise<Invoice> {
    return this.repository.put(id, dto);
  }
}
