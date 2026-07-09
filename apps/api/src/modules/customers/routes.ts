import { Router } from 'express';
import { requireCompanyRole } from '../../middleware/require-role.js';
import {
  createCustomer,
  deleteCustomer,
  findAll,
  findById,
  updateCustomer,
} from './controller.js';

export const customersRouter = Router();

const requireWriteAccess = requireCompanyRole('OWNER', 'ADMIN');

customersRouter.post('/create', requireWriteAccess, createCustomer);
customersRouter.get('/findAll', findAll);
customersRouter.get('/find/:id', findById);
customersRouter.put('/update/:id', requireWriteAccess, updateCustomer);
customersRouter.delete('/delete/:id', requireWriteAccess, deleteCustomer);
