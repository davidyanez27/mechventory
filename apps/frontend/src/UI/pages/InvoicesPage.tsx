import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { useInvoice } from '@/hooks/useInvoice';
import { ComponentCard } from '@/UI/components/interaction';
import { DataTable } from '@/UI/components/information';
import type { ColumnDef } from '@/UI/components/information';
import { Input } from '@/UI/components/form';
import Badge from '@/UI/components/feedback/Badge';
import { Eye, Pencil, Trash2 } from '@/UI/helpers';
import { toast } from 'sonner';
import { fmt, getErrorMessage, STATUS_COLOR, STATUS_LABEL } from '@/UI/data/constants';
import { openInvoicePdf } from '@/helpers/invoice.helpers';
import type { PaginationQuery } from '@serveless/shared/common';
import type { Invoice } from '@serveless/shared/invoice';

export function InvoicesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const filters: PaginationQuery = {
    page, limit: 20, search, sortBy: '', sortOrder: 'asc', status: 'active',
  };

  const { data, isLoading, isError, remove } = useInvoice(filters);
  const list = data;

  const handleDelete = (id: string) =>
    remove(id)
      .then(() => toast.success('Invoice deleted'))
      .catch((err) => toast.error(getErrorMessage(err)));

  const handleViewPdf = (id: string) =>
    openInvoicePdf(id).catch((err) => toast.error(getErrorMessage(err)));

  const columns: ColumnDef<Invoice>[] = [
    {
      key: 'number',
      header: t('invoices.colNum'),
      cell: (r) => <span className="font-semibold text-foreground">{r.number}</span>,
    },
    {
      key: 'status',
      header: t('invoices.colStatus'),
      cell: (r) => (
        <Badge color={STATUS_COLOR[r.status]} size="sm">
          {STATUS_LABEL[r.status]}
        </Badge>
      ),
    },
    {
      key: 'customerName',
      header: t('invoices.colCustomer'),
      cell: (r) => r.customerName || <span className="text-gray-400 text-sm">{r.customer.slice(0, 8)}…</span>,
    },
    {
      key: 'total',
      header: t('invoices.colTotal'),
      cell: (r) => (
        <span className="font-medium tabular-nums">
          {r.currency} {r.total.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'issueDate',
      header: t('invoices.colIssued'),
      cell: (r) => fmt(r.issueDate),
    },
    {
      key: 'dueDate',
      header: t('invoices.colDue'),
      cell: (r) => r.dueDate ? fmt(r.dueDate) : <span className="text-gray-400">—</span>,
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-24',
      cell: (r) => {
        const isLocked = r.status === 'PAID' || r.status === 'CANCELED';
        const canDelete = r.status === 'DRAFT';
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleViewPdf(r.id)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
              title="View PDF"
            >
              <Eye className="size-4" />
            </button>
            <button
              onClick={() => navigate({ to: '/invoices/$invoiceId', params: { invoiceId: r.id } })}
              disabled={isLocked}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-400 disabled:hover:bg-transparent"
              title={isLocked ? 'Cannot edit a paid or canceled invoice' : 'Edit'}
            >
              <Pencil className="size-4" />
            </button>
            <button
              onClick={() => handleDelete(r.id)}
              disabled={!canDelete}
              className="p-1.5 rounded-lg text-gray-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-400 disabled:hover:bg-transparent"
              title={canDelete ? 'Delete' : 'Only draft invoices can be deleted'}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('invoices.title')}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('invoices.subtitle')}
          </p>
        </div>
      </div>

      <ComponentCard title={t('invoices.allInvoices')}>
        <div className="mb-4">
          <Input
            placeholder={t('invoices.searchPlaceholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <DataTable
          columns={columns}
          rows={list?.data}
          pagination={list?.pagination}
          onPageChange={setPage}
          isLoading={isLoading}
          isError={isError}
          emptyMessage={t('invoices.noFound')}
        />
      </ComponentCard>
    </div>
  );
}
