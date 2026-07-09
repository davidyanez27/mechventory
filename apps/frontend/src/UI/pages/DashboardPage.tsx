import { useTranslation } from 'react-i18next';
import { useInvoice } from '@/hooks/useInvoice';
import { useCustomer } from '@/hooks/useCustomer';
import { ComponentCard } from '@/UI/components/interaction';
import { DataTable } from '@/UI/components/information';
import type { ColumnDef } from '@/UI/components/information';
import Badge from '@/UI/components/feedback/Badge';
import { fmt, STATUS_COLOR, STATUS_LABEL, FIRST_PAGE } from '@/UI/data/constants';
import type { Customer } from '@serveless/shared/customer';
import type { Invoice } from '@serveless/shared/invoice';

export function DashboardPage() {
  const { t } = useTranslation();

  const invoiceCols: ColumnDef<Invoice>[] = [
    {
      key: 'number',
      header: t('dashboard.colInvoiceNum'),
      cell: (r) => (
        <span className="font-semibold text-brand-600 dark:text-brand-400">{r.number}</span>
      ),
    },
    {
      key: 'status',
      header: t('dashboard.colStatus'),
      cell: (r) => (
        <Badge color={STATUS_COLOR[r.status]} size="sm">
          {STATUS_LABEL[r.status]}
        </Badge>
      ),
    },
    {
      key: 'customerName',
      header: t('dashboard.colCustomer'),
      cell: (r) => r.customerName || <span className="text-gray-400 text-sm">{r.customer.slice(0, 8)}…</span>,
    },
    {
      key: 'total',
      header: t('dashboard.colTotal'),
      cell: (r) => (
        <span className="font-medium">
          {r.currency} {r.total.toFixed(2)}
        </span>
      ),
    },
    { key: 'issueDate', header: t('dashboard.colIssued'), cell: (r) => fmt(r.issueDate) },
  ];

  const customerCols: ColumnDef<Customer>[] = [
    {
      key: 'name',
      header: t('dashboard.colName'),
      cell: (r) => <span className="font-medium text-foreground">{r.name}</span>,
    },
    {
      key: 'email',
      header: t('dashboard.colEmail'),
      cell: (r) =>
        r.email ? (
          <a href={`mailto:${r.email}`} className="text-brand-500 hover:underline text-sm">
            {r.email}
          </a>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: 'phone',
      header: t('dashboard.colPhone'),
      cell: (r) => r.phone || <span className="text-gray-400">—</span>,
    },
    { key: 'createdAt', header: t('dashboard.colAdded'), cell: (r) => fmt(r.createdAt) },
  ];

  const { data: invData, isLoading: invLoading, isError: invError } = useInvoice(FIRST_PAGE);
  const { data: custData, isLoading: custLoading, isError: custError } = useCustomer(FIRST_PAGE);

  const invoices = invData?.data;
  const customers = custData?.data;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t('dashboard.title')}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ComponentCard title={t('dashboard.recentInvoices')} desc={t('dashboard.latestInvoices')}>
          <DataTable
            columns={invoiceCols}
            rows={invoices}
            isLoading={invLoading}
            isError={invError}
            skeletonRows={5}
            emptyMessage={t('dashboard.noInvoices')}
          />
        </ComponentCard>

        <ComponentCard title={t('dashboard.activeCustomers')} desc={t('dashboard.recentCustomers')}>
          <DataTable
            columns={customerCols}
            rows={customers}
            isLoading={custLoading}
            isError={custError}
            skeletonRows={5}
            emptyMessage={t('dashboard.noCustomers')}
          />
        </ComponentCard>
      </div>
    </div>
  );
}
