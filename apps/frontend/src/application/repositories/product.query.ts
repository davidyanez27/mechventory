import type { PaginationQuery } from '@serveless/shared/common';
import type { Product, CreateProductDto, UpdateProductDto, ListProducts } from '@serveless/shared/product';

export abstract class ProductRepository {
  abstract getById(id: string): Promise<Product>;
  abstract getAll(options: PaginationQuery): Promise<ListProducts>;
  abstract post(dto: CreateProductDto): Promise<Product>;
  abstract put(id: string, dto: UpdateProductDto): Promise<Product>;
  abstract delete(id: string): Promise<Product>;
}
