import type { Product } from '@serveless/shared/product';
import type { ProductRepository } from '../../repositories';

export class DeleteProduct {
  constructor(private readonly repository: ProductRepository) {}
  async execute(id: string): Promise<Product> {
    return this.repository.delete(id);
  }
}
