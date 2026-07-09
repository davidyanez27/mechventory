import { CustomerDatasourceImpl } from '../datasources';
import { CreateCustomer, UpdateCustomer, DeleteCustomer, FindCustomer, FindAllCustomers } from '../../application/use-cases/customer';

const customerRepository = new CustomerDatasourceImpl();

export const customerUseCases = {
  create:   new CreateCustomer(customerRepository),
  update:   new UpdateCustomer(customerRepository),
  delete:   new DeleteCustomer(customerRepository),
  findById: new FindCustomer(customerRepository),
  findAll:  new FindAllCustomers(customerRepository),
};
