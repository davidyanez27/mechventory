import type { InviteMemberDto } from '@serveless/shared/user';
import type { UserRepository } from '../../repositories';

export class InviteUser {
  constructor(private readonly repository: UserRepository) {}
  async execute(dto: InviteMemberDto): Promise<{ message: string }> {
    return this.repository.invite(dto);
  }
}
