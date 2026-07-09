import type { PaginationQuery } from '@serveless/shared/common';
import type { ListProducts } from '@serveless/shared/product';
import type { ProductRepository } from '../../repositories';

export class FindAllProducts {
  constructor(private readonly repository: ProductRepository) {}
  async execute(options: PaginationQuery): Promise<ListProducts> {
    return this.repository.getAll(options);
  }
}
