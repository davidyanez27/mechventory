import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { BasePagination } from '@serveless/shared/common';
import { Table, TableHeader, TableBody, TableRow, TableCell } from './Table';

// ─── Column Definition ─────────────────────────────────────────────────────

export interface ColumnDef<T> {
  /** Unique key used as React key */
  key: string;
  /** Text rendered in the <th> */
  header: string;
  /** Returns the cell content for a given row */
  cell: (row: T) => ReactNode;
  /** Extra classes on the <th> */
  headerClassName?: string;
  /** Extra classes on the <td> */
  cellClassName?: string;
}

// ─── Props ─────────────────────────────────────────────────────────────────

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  /** The array of items — typically `data?.someEntity.data` from a hook */
  rows?: T[];
  /** Pagination metadata — typically `data?.someEntity.pagination` */
  pagination?: BasePagination;
  isLoading?: boolean;
  isError?: boolean;
  /** Called when the user clicks Previous / Next */
  onPageChange?: (page: number) => void;
  /** How many skeleton rows to render while loading (default 5) */
  skeletonRows?: number;
  /** Message shown when rows is empty */
  emptyMessage?: string;
}

// ─── Shared class strings ───────────────────────────────────────────────────

const TH = 'px-5 py-3 font-medium text-muted-foreground text-start text-theme-xs';
const TD = 'px-4 py-3 text-foreground text-start text-theme-sm';

// ─── Component ─────────────────────────────────────────────────────────────

export function DataTable<T extends object>({
  columns,
  rows,
  pagination,
  isLoading = false,
  isError = false,
  onPageChange,
  skeletonRows = 5,
  emptyMessage = 'No records found.',
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;
  const currentPage = pagination?.page ?? 1;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Header */}
          <TableHeader className="border-b border-border">
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  isHeader
                  className={`${TH} ${col.headerClassName ?? ''}`}
                >
                  {col.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>

          {/* Body */}
          <TableBody className="divide-y divide-border">
            {isLoading ? (
              /* Skeleton rows */
              Array.from({ length: skeletonRows }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={`${TD} ${col.cellClassName ?? ''}`}>
                      <div className="h-4 rounded bg-muted animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              /* Error state */
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-10 text-center text-theme-sm text-error-500"
                >
                  Failed to load data. Please try again.
                </td>
              </tr>
            ) : !rows?.length ? (
              /* Empty state */
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-10 text-center text-theme-sm text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              /* Data rows */
              rows.map((row, i) => (
                <TableRow key={('id' in row ? String(row.id) : null) ?? i}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={`${TD} ${col.cellClassName ?? ''}`}>
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination — only shown when there is more than one page */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <span className="text-theme-xs text-muted-foreground">
            {t('common.pageOf', { page: currentPage, pages: totalPages, total: pagination.total })}
          </span>
          <div className="flex gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => onPageChange?.(currentPage - 1)}
              className="px-3 py-1.5 text-theme-xs font-medium rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t('common.previous')}
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange?.(currentPage + 1)}
              className="px-3 py-1.5 text-theme-xs font-medium rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
