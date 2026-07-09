import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PaginationQuery } from '@serveless/shared/common';
import type { CreateCustomerDto, UpdateCustomerDto } from '@serveless/shared/customer';
import { customerUseCases } from '@/infrastructure/repositories';

const KEY = ['customers'];

const DEFAULT_FILTERS: PaginationQuery = {
  page: 1, limit: 10, search: '', sortBy: '', sortOrder: 'asc', status: 'active',
};

export const useCustomer = (filters: PaginationQuery = DEFAULT_FILTERS) => {
  const qc = useQueryClient();

  const listQuery = useQuery({
    queryKey: [...KEY, filters],
    queryFn: () => customerUseCases.findAll.execute(filters),
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateCustomerDto) => customerUseCases.create.execute(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCustomerDto }) =>
      customerUseCases.update.execute(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customerUseCases.delete.execute(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  return {
    data: listQuery.data,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
