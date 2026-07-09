import type { PaginationQuery } from '@serveless/shared/common';
import type { InviteMemberDto, ListUsers } from '@serveless/shared/user';

export abstract class UserRepository {
  abstract getAll(options: PaginationQuery): Promise<ListUsers>;
  abstract invite(dto: InviteMemberDto): Promise<{ message: string }>;
  abstract delete(id: string): Promise<{ message: string }>;
}
