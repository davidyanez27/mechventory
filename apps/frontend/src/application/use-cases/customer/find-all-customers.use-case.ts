import type { PaginationQuery } from '@serveless/shared/common';
import type { ListCustomers } from '@serveless/shared/customer';
import type { CustomerRepository } from '../../repositories';

export class FindAllCustomers {
  constructor(private readonly repository: CustomerRepository) {}
  async execute(options: PaginationQuery): Promise<ListCustomers> {
    return this.repository.getAll(options);
  }
}
