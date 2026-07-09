import { ProductDatasourceImpl } from '../datasources';
import { CreateProduct, UpdateProduct, DeleteProduct, FindProduct, FindAllProducts } from '../../application/use-cases/product';

const productRepository = new ProductDatasourceImpl();

export const productUseCases = {
  create:   new CreateProduct(productRepository),
  update:   new UpdateProduct(productRepository),
  delete:   new DeleteProduct(productRepository),
  findById: new FindProduct(productRepository),
  findAll:  new FindAllProducts(productRepository),
};
