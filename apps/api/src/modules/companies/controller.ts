import type { Request, Response } from 'express';
import { paginationQuerySchema } from '@serveless/shared/common';
import { updateCompanySchema } from '@serveless/shared/company';
import { inviteMemberSchema } from '@serveless/shared/user';
import { deleteCognitoUser, inviteCognitoUser } from '../../lib/cognito.js';
import { CustomError } from '../../lib/errors.js';
import { toListResponse } from '../../lib/pagination.js';
import * as repository from './repository.js';

export const findAll = async (req: Request, res: Response) => {
  const { userId } = req.identity;
  const { page, limit } = paginationQuerySchema.parse(req.query);

  const { data, pagination } = await repository.findAll(userId, page, limit);
  res.json(toListResponse('companies', data, pagination));
};

export const findById = async (req: Request<{ id: string }>, res: Response) => {
  const { userId } = req.identity;

  const company = await repository.findByUuid(userId, req.params.id);
  if (!company) throw CustomError.notFound('Company not found');
  res.json(company);
};

export const updateCompany = async (req: Request<{ id: string }>, res: Response) => {
  const { companyId } = req.identity;
  const dto = updateCompanySchema.parse({ ...req.body, uuid: req.params.id });

  const company = await repository.update(companyId, dto);
  if (!company) throw CustomError.notFound('Company not found');
  res.json(company);
};

export const inviteMember = async (req: Request, res: Response) => {
  const { companyId } = req.identity;
  const dto = inviteMemberSchema.parse(req.body);

  if (await repository.emailTaken(dto.email)) {
    throw CustomError.conflict('A user with this email already exists');
  }

  // Cognito goes first because the DB row needs the sub it assigns. Should it
  // reject anyway (orphaned Cognito account), cognitoErrorMiddleware answers 409.
  const cognitoSub = await inviteCognitoUser(dto.email, dto.fullName);

  // Not error handling — compensation: if the DB half fails, the Cognito user
  // is removed again so the invite stays retryable.
  try {
    await repository.addMember(companyId, dto, cognitoSub);
  } catch (err) {
    await deleteCognitoUser(dto.email).catch(() => undefined);
    throw err;
  }

  res.status(201).json({ message: 'Invitation sent successfully' });
};
