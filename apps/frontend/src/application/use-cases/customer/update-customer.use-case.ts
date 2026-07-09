import type { UpdateCustomerDto, Customer } from '@serveless/shared/customer';
import type { CustomerRepository } from '../../repositories';

export class UpdateCustomer {
  constructor(private readonly repository: CustomerRepository) {}
  async execute(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    return this.repository.put(id, dto);
  }
}
