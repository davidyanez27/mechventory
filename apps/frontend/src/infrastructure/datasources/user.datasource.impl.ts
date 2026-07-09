import type { PaginationQuery } from '@serveless/shared/common';
import type { InviteMemberDto, ListUsers } from '@serveless/shared/user';
import type { UserRepository } from '../../application';
import InventoryApi from '../api/api-client';

export class UserDatasourceImpl implements UserRepository {
  async getAll(options: PaginationQuery): Promise<ListUsers> {
    const { data } = await InventoryApi.get(`/users/findAll`, {
      params: { page: options.page, limit: options.limit },
    });
    return data;
  }
  // The invite lives under /companies: it grants workspace membership, not
  // just a user row.
  async invite(dto: InviteMemberDto): Promise<{ message: string }> {
    const { data } = await InventoryApi.post(`/companies/invite`, dto);
    return data;
  }
  async delete(id: string): Promise<{ message: string }> {
    const { data } = await InventoryApi.delete(`/users/delete/${id}`);
    return data;
  }
}
