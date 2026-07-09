import type { CustomerRepository } from '../../repositories';
import type { Customer } from '@serveless/shared/customer';

export class DeleteCustomer {
  constructor(private readonly repository: CustomerRepository) {}
  async execute(id: string): Promise<Customer> {
    return this.repository.delete(id);
  }
}
