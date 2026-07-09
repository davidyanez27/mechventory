import type { Request, Response } from 'express';
import { paginationQuerySchema } from '@serveless/shared/common';
import { updateUserSchema } from '@serveless/shared/user';
import { CustomError } from '../../lib/errors.js';
import { toListResponse } from '../../lib/pagination.js';
import * as repository from './repository.js';

// The caller's own row plus the company context identityMiddleware attached.
export const me = async (req: Request, res: Response) => {
  const user = await repository.findSelf(req.identity.userId);
  if (!user) throw CustomError.notFound('User not found');

  const { companyUuid, companyName, companyRole } = req.identity;
  res.json({ ...user, company: { uuid: companyUuid, name: companyName, role: companyRole } });
};

export const findAll = async (req: Request, res: Response) => {
  const { companyId } = req.identity;
  const { page, limit } = paginationQuerySchema.parse(req.query);

  const { data, pagination } = await repository.findAll(companyId, page, limit);
  res.json(toListResponse('users', data, pagination));
};

export const findById = async (req: Request<{ id: string }>, res: Response) => {
  const { companyId } = req.identity;

  const user = await repository.findByUuid(companyId, req.params.id);
  if (!user) throw CustomError.notFound('User not found');
  res.json(user);
};

export const updateUser = async (req: Request<{ id: string }>, res: Response) => {
  const { companyId } = req.identity;
  const dto = updateUserSchema.parse({ ...req.body, uuid: req.params.id });

  const updated = await repository.updateFullName(companyId, dto.uuid, dto.fullName);
  if (!updated) throw CustomError.notFound('User not found');
  res.json({ message: 'User updated successfully' });
};

export const deleteUser = async (req: Request<{ id: string }>, res: Response) => {
  const { companyId, userUuid } = req.identity;

  // An OWNER deactivating themselves would lock the whole workspace out.
  if (req.params.id === userUuid) {
    throw CustomError.badRequest('You cannot delete your own account');
  }

  const deleted = await repository.deactivate(companyId, req.params.id);
  if (!deleted) throw CustomError.notFound('User not found');
  res.json({ message: 'User deleted successfully' });
};
