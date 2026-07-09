import type { PaginationQuery } from '@serveless/shared/common';
import type { Product, CreateProductDto, UpdateProductDto, ListProducts } from '@serveless/shared/product';
import type { ProductRepository } from '../../application';
import InventoryApi from '../api/api-client';

export class ProductDatasourceImpl implements ProductRepository {
  async getById(id: string): Promise<Product> {
    const { data } = await InventoryApi.get(`/products/find/${id}`);
    return data;
  }
  async getAll(options: PaginationQuery): Promise<ListProducts> {
    const { data } = await InventoryApi.get(`/products/findAll`, {
      params: { page: options.page, limit: options.limit },
    });
    return data;
  }
  async post(dto: CreateProductDto): Promise<Product> {
    const { data } = await InventoryApi.post(`/products/create`, dto);
    return data;
  }
  async put(id: string, dto: UpdateProductDto): Promise<Product> {
    const { data } = await InventoryApi.put(`/products/update/${id}`, dto);
    return data;
  }
  async delete(id: string): Promise<Product> {
    const { data } = await InventoryApi.delete(`/products/delete/${id}`);
    return data;
  }
}
