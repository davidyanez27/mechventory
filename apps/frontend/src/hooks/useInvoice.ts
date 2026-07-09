import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PaginationQuery } from '@serveless/shared/common';
import type { CreateInvoiceDto, UpdateInvoiceDto } from '@serveless/shared/invoice';
import { invoiceUseCases } from '@/infrastructure/repositories';

export const useInvoiceById = (id: string) =>
  useQuery({
    queryKey: ['invoices', id],
    queryFn: () => invoiceUseCases.findById.execute(id),
    enabled: !!id,
  });

const KEY = ['invoices'];

const DEFAULT_FILTERS: PaginationQuery = {
  page: 1, limit: 10, search: '', sortBy: '', sortOrder: 'asc', status: 'active',
};

export const useInvoice = (filters: PaginationQuery = DEFAULT_FILTERS) => {
  const qc = useQueryClient();

  const listQuery = useQuery({
    queryKey: [...KEY, filters],
    queryFn: () => invoiceUseCases.findAll.execute(filters),
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateInvoiceDto) => invoiceUseCases.create.execute(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateInvoiceDto }) =>
      invoiceUseCases.update.execute(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => invoiceUseCases.delete.execute(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const findOneQuery = (id: string) => ({
    queryKey: [...KEY, id],
    queryFn: () => invoiceUseCases.findById.execute(id),
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
    findOneQuery,
  };
};
