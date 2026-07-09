import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PaginationQuery } from '@serveless/shared/common';
import type { CreateProductDto, UpdateProductDto } from '@serveless/shared/product';
import { productUseCases } from '@/infrastructure/repositories';

const KEY = ['products'];

const DEFAULT_FILTERS: PaginationQuery = {
  page: 1, limit: 10, search: '', sortBy: '', sortOrder: 'asc', status: 'active',
};

export const useProduct = (filters: PaginationQuery = DEFAULT_FILTERS) => {
  const qc = useQueryClient();

  const listQuery = useQuery({
    queryKey: [...KEY, filters],
    queryFn: () => productUseCases.findAll.execute(filters),
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateProductDto) => productUseCases.create.execute(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateProductDto }) =>
      productUseCases.update.execute(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productUseCases.delete.execute(id),
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
