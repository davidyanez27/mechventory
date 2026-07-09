import { Router } from 'express';
import { requireCompanyRole } from '../../middleware/require-role.js';
import {
  createInvoice,
  deleteInvoice,
  findAll,
  findById,
  generateInvoicePdf,
  updateInvoice,
} from './controller.js';

export const invoicesRouter = Router();

const requireWriteAccess = requireCompanyRole('OWNER', 'ADMIN');

invoicesRouter.post('/create', requireWriteAccess, createInvoice);
invoicesRouter.get('/pdf/:id', generateInvoicePdf);
invoicesRouter.get('/findAll', findAll);
invoicesRouter.get('/find/:id', findById);
invoicesRouter.put('/update/:id', requireWriteAccess, updateInvoice);
invoicesRouter.delete('/delete/:id', requireWriteAccess, deleteInvoice);
