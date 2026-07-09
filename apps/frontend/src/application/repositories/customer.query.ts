import type { PaginationQuery } from '@serveless/shared/common';
import type { Customer, CreateCustomerDto, UpdateCustomerDto, ListCustomers } from '@serveless/shared/customer';

export abstract class CustomerRepository {
  abstract getById(id: string): Promise<Customer>;
  abstract getAll(options: PaginationQuery): Promise<ListCustomers>;
  abstract post(dto: CreateCustomerDto): Promise<Customer>;
  abstract put(id: string, dto: UpdateCustomerDto): Promise<Customer>;
  abstract delete(id: string): Promise<Customer>;
}
