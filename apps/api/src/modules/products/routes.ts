import { Router } from 'express';
import { requireCompanyRole } from '../../middleware/require-role.js';
import {
  createProduct,
  deleteProduct,
  findAll,
  findById,
  updateProduct,
} from './controller.js';

export const productsRouter = Router();

const requireWriteAccess = requireCompanyRole('OWNER', 'ADMIN');

productsRouter.post('/create', requireWriteAccess, createProduct);
productsRouter.get('/findAll', findAll);
productsRouter.get('/find/:id', findById);
productsRouter.put('/update/:id', requireWriteAccess, updateProduct);
productsRouter.delete('/delete/:id', requireWriteAccess, deleteProduct);
