import type { PaginationQuery } from '@serveless/shared/common';
import type { ListUsers } from '@serveless/shared/user';
import type { UserRepository } from '../../repositories';

export class FindAllUsers {
  constructor(private readonly repository: UserRepository) {}
  async execute(options: PaginationQuery): Promise<ListUsers> {
    return this.repository.getAll(options);
  }
}
