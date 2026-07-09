import type { BasePagination, ListResponse } from '@serveless/shared/common';

const API_BASE_URL = process.env.API_BASE_URL ?? '';

// What every repository findAll returns alongside its rows.
export type RepositoryPage = {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
};

// Every findAll answers the same envelope: rows plus a pagination block with
// page/limit/total and ready-made links (null at either end of the list).
export const toListResponse = <T>(
  resource: string,
  data: T[],
  p: RepositoryPage,
): ListResponse<T> => {
  const pagination: BasePagination = {
    page: p.page,
    limit: p.limit,
    total: p.total,
    next: p.hasNext
      ? `${API_BASE_URL}/${resource}/findAll?page=${p.page + 1}&limit=${p.limit}`
      : null,
    prev: p.hasPrev
      ? `${API_BASE_URL}/${resource}/findAll?page=${p.page - 1}&limit=${p.limit}`
      : null,
  };
  return { data, pagination };
};
