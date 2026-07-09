import type { Request, Response } from 'express';
import { paginationQuerySchema } from '@serveless/shared/common';
import { createCustomerSchema, updateCustomerSchema } from '@serveless/shared/customer';
import { CustomError } from '../../lib/errors.js';
import { toListResponse } from '../../lib/pagination.js';
import * as repository from './repository.js';

export const createCustomer = async (req: Request, res: Response) => {
  const { companyId, userId } = req.identity;
  const dto = createCustomerSchema.parse(req.body);

  await repository.create(companyId, userId, dto);
  res.status(201).json({ message: 'Customer created successfully' });
};

export const findAll = async (req: Request, res: Response) => {
  const { companyId } = req.identity;
  const { page, limit } = paginationQuerySchema.parse(req.query);

  const { data, pagination } = await repository.findAll(companyId, page, limit);
  res.json(toListResponse('customers', data, pagination));
};

export const findById = async (req: Request<{ id: string }>, res: Response) => {
  const { companyId } = req.identity;

  const customer = await repository.findByUuid(companyId, req.params.id);
  if (!customer) throw CustomError.notFound('Customer not found');
  res.json(customer);
};

export const updateCustomer = async (req: Request<{ id: string }>, res: Response) => {
  const { companyId, userId } = req.identity;
  const dto = updateCustomerSchema.parse({ ...req.body, uuid: req.params.id });

  const customer = await repository.update(companyId, userId, dto);
  if (!customer) throw CustomError.notFound('Customer not found');
  res.json(customer);
};

export const deleteCustomer = async (req: Request<{ id: string }>, res: Response) => {
  const { companyId } = req.identity;

  const deleted = await repository.deactivate(companyId, req.params.id);
  if (!deleted) throw CustomError.notFound('Customer not found');
  res.json({ message: 'Customer deleted successfully' });
};
