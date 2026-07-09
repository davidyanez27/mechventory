import type { CreateCustomerDto, Customer } from '@serveless/shared/customer';
import type { CustomerRepository } from '../../repositories';

export class CreateCustomer {
  constructor(private readonly repository: CustomerRepository) {}
  async execute(dto: CreateCustomerDto): Promise<Customer> {
    return this.repository.post(dto);
  }
}
