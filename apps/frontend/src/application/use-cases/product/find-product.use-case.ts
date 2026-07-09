import type { Product } from '@serveless/shared/product';
import type { ProductRepository } from '../../repositories';

export class FindProduct {
  constructor(private readonly repository: ProductRepository) {}
  async execute(id: string): Promise<Product> {
    return this.repository.getById(id);
  }
}
