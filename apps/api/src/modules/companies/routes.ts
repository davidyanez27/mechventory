import { Router } from 'express';
import { requireCompanyRole } from '../../middleware/require-role.js';
import { findAll, findById, inviteMember, updateCompany } from './controller.js';

export const companiesRouter = Router();

// No POST /create: the workspace is created exactly once by the Cognito
// post-confirmation trigger. Update (rename + business details) is OWNER-only.
companiesRouter.get('/findAll', findAll);
companiesRouter.get('/find/:id', findById);
companiesRouter.put('/update/:id', requireCompanyRole('OWNER'), updateCompany);
companiesRouter.post('/invite', requireCompanyRole('OWNER', 'ADMIN'), inviteMember);
