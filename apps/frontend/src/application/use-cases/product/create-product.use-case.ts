import type { CreateProductDto, Product } from '@serveless/shared/product';
import type { ProductRepository } from '../../repositories';

export class CreateProduct {
  constructor(private readonly repository: ProductRepository) {}
  async execute(dto: CreateProductDto): Promise<Product> {
    return this.repository.post(dto);
  }
}
