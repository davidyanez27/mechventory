import { InvoiceDatasourceImpl } from '../datasources';
import { CreateInvoice, UpdateInvoice, DeleteInvoice, FindInvoice, FindAllInvoices } from '../../application/use-cases/invoice';

const invoiceRepository = new InvoiceDatasourceImpl();

export const invoiceUseCases = {
  create:   new CreateInvoice(invoiceRepository),
  update:   new UpdateInvoice(invoiceRepository),
  delete:   new DeleteInvoice(invoiceRepository),
  findById: new FindInvoice(invoiceRepository),
  findAll:  new FindAllInvoices(invoiceRepository),
};
