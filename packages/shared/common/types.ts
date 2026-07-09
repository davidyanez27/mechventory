export interface BasePagination {
  page: number;
  limit: number;
  total: number;
  next: string | null;
  prev: string | null;
}

export type SortOrder = 'asc' | 'desc';
export type Status = 'active' | 'inactive';

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: SortOrder;
  status?: Status;
}

// Shape of every findAll response: one page of rows plus the pagination block
// (page/limit/total and ready-made links, null at either end of the list).
export interface ListResponse<T> {
  data: T[];
  pagination: BasePagination;
}
