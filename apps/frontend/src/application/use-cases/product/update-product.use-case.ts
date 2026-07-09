import type { UpdateProductDto, Product } from '@serveless/shared/product';
import type { ProductRepository } from '../../repositories';

export class UpdateProduct {
  constructor(private readonly repository: ProductRepository) {}
  async execute(id: string, dto: UpdateProductDto): Promise<Product> {
    return this.repository.put(id, dto);
  }
}
