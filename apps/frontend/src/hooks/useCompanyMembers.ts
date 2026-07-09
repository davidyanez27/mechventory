import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PaginationQuery } from '@serveless/shared/common';
import type { InviteMemberDto } from '@serveless/shared/user';
import { userUseCases } from '@/infrastructure/repositories';

const KEY = ['company-members'];

export const useCompanyMembers = (filters: PaginationQuery) => {
  const qc = useQueryClient();

  const listQuery = useQuery({
    queryKey: [...KEY, filters],
    queryFn: () => userUseCases.findAll.execute(filters),
  });

  const inviteMutation = useMutation({
    mutationFn: (dto: InviteMemberDto) => userUseCases.invite.execute(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => userUseCases.delete.execute(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  return {
    data: listQuery.data,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    invite: inviteMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
    isInviting: inviteMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
};
