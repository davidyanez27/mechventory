import type { PaginationQuery } from '@serveless/shared/common';
import type { Customer, CreateCustomerDto, UpdateCustomerDto, ListCustomers } from '@serveless/shared/customer';
import type { CustomerRepository } from '../../application';
import InventoryApi from '../api/api-client';

export class CustomerDatasourceImpl implements CustomerRepository {
  async getById(id: string): Promise<Customer> {
    const { data } = await InventoryApi.get(`/customers/find/${id}`);
    return data;
  }
  async getAll(options: PaginationQuery): Promise<ListCustomers> {
    const { data } = await InventoryApi.get(`/customers/findAll`, {
      params: { page: options.page, limit: options.limit },
    });
    return data;
  }
  async post(dto: CreateCustomerDto): Promise<Customer> {
    const { data } = await InventoryApi.post(`/customers/create`, dto);
    return data;
  }
  async put(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const { data } = await InventoryApi.put(`/customers/update/${id}`, dto);
    return data;
  }
  async delete(id: string): Promise<Customer> {
    const { data } = await InventoryApi.delete(`/customers/delete/${id}`);
    return data;
  }
}
