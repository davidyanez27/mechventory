import type { UserRepository } from '../../repositories';

export class DeleteUser {
  constructor(private readonly repository: UserRepository) {}
  async execute(id: string): Promise<{ message: string }> {
    return this.repository.delete(id);
  }
}
