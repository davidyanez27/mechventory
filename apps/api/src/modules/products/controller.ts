import type { Request, Response } from 'express';
import { paginationQuerySchema } from '@serveless/shared/common';
import { createProductSchema, updateProductSchema } from '@serveless/shared/product';
import { CustomError } from '../../lib/errors.js';
import { toListResponse } from '../../lib/pagination.js';
import * as repository from './repository.js';
import type { ItemRow } from './repository.js';

// Response shape for writes: the writer is always the current user, so
// createdBy/updatedBy come from the token instead of a second DB read.
const rowToDto = (row: ItemRow) => ({
  uuid: row.uuid,
  name: row.name,
  description: row.description,
  defaultPrice: Number(row.defaultPrice),
  currency: row.currency,
  unit: row.unit,
  type: row.type,
  isActive: row.isActive,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const createProduct = async (req: Request, res: Response) => {
  const { companyId, userId, fullName } = req.identity;
  const dto = createProductSchema.parse(req.body);

  const row = await repository.create(companyId, userId, dto);
  res.status(201).json({ ...rowToDto(row), createdBy: fullName, updatedBy: fullName });
};

export const findAll = async (req: Request, res: Response) => {
  const { companyId } = req.identity;
  const { page, limit } = paginationQuerySchema.parse(req.query);

  const { data, pagination } = await repository.findAll(companyId, page, limit);
  res.json(toListResponse('products', data, pagination));
};

export const findById = async (req: Request<{ id: string }>, res: Response) => {
  const { companyId } = req.identity;

  const product = await repository.findByUuid(companyId, req.params.id);
  if (!product) throw CustomError.notFound('Product not found');
  res.json(product);
};

export const updateProduct = async (req: Request, res: Response) => {
  const { companyId, userId, fullName } = req.identity;
  const dto = updateProductSchema.parse({ ...req.body, uuid: req.params.id });

  const row = await repository.update(companyId, userId, dto);
  if (!row) throw CustomError.notFound('Product not found');
  res.json({ ...rowToDto(row), updatedBy: fullName });
};

export const deleteProduct = async (req: Request<{ id: string }>, res: Response) => {
  const { companyId } = req.identity;

  const deleted = await repository.deactivate(companyId, req.params.id);
  if (!deleted) throw CustomError.notFound('Product not found');
  res.json('Product deleted successfully');
};
