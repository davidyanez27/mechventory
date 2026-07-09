import type { Customer } from '@serveless/shared/customer';
import type { CustomerRepository } from '../../repositories';

export class FindCustomer {
  constructor(private readonly repository: CustomerRepository) {}
  async execute(id: string): Promise<Customer> {
    return this.repository.getById(id);
  }
}
