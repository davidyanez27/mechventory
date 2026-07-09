import { Router } from 'express';
import { requireCompanyRole } from '../../middleware/require-role.js';
import { deleteUser, findAll, findById, me, updateUser } from './controller.js';

export const usersRouter = Router();

const requireWriteAccess = requireCompanyRole('OWNER', 'ADMIN');

// No POST /create: teammates arrive via Cognito (signup today, invite flow
// later), never with an API-managed password.
usersRouter.get('/me', me);
usersRouter.get('/findAll', findAll);
usersRouter.get('/find/:id', findById);
usersRouter.put('/update/:id', requireWriteAccess, updateUser);
usersRouter.delete('/delete/:id', requireWriteAccess, deleteUser);
