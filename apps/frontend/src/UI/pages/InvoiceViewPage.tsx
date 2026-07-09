import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { useInvoiceById } from '@/hooks/useInvoice'
import { useAuth } from '@/hooks/useAuth'
import { useCustomer } from '@/hooks/useCustomer'
import { Button } from '@/UI/components/form'
import Badge from '@/UI/components/feedback/Badge'
import { ArrowLeft, Pencil, Printer } from '@/UI/helpers'
import { LoadingSpinner } from '@/UI/components/interaction/LoadingSpinner'
import { formatCurrency, formatDate } from '@/helpers/format.helpers'
import { STATUS_COLOR, ALL_ACTIVE } from '@/UI/data/constants'
import type { InvoiceStatus } from '@serveless/shared/invoice'

const STATUS_I18N_KEY: Record<InvoiceStatus, string> = {
  DRAFT:          'invoices.draft',
  SENT:           'invoices.sent',
  PARTIALLY_PAID: 'invoices.partiallyPaid',
  PAID:           'invoices.paid',
  OVERDUE:        'invoices.overdue',
  CANCELED:       'invoices.canceled',
}

interface InvoiceViewPageProps {
  invoiceId: string
}

export function InvoiceViewPage({ invoiceId }: InvoiceViewPageProps) {
  const navigate = useNavigate()
  const { data: invoice, isLoading, isError } = useInvoiceById(invoiceId)
  const { company } = useAuth()
  const { data: customerData } = useCustomer(ALL_ACTIVE)
  const { t, i18n } = useTranslation()

  if (isLoading) return <LoadingSpinner />

  if (isError || !invoice || !company) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-muted-foreground">{t('invoices.view.notFound')}</p>
      </div>
    )
  }

  const customers = customerData?.data ?? []
  const customer = customers.find((c) => c.id === invoice.customer) ?? null

  const subtotal = invoice.items.reduce(
    (s, it) => s + it.quantity * it.unitPrice * (1 - it.discount / 100),
    0,
  )
  const taxAmt  = subtotal * (invoice.tax / 100)
  const discAmt = subtotal * (invoice.discount / 100)
  const total   = subtotal + taxAmt - discAmt

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-y-3 print:hidden">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: '/invoices' })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {invoice.number}
            </h1>
            <p className="text-sm text-muted-foreground">{customer?.name ?? ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            startIcon={<Printer className="h-3.5 w-3.5" />}
          >
            {t('invoices.view.print')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate({ to: '/invoices/$invoiceId/edit', params: { invoiceId: invoice.id } })
            }
            startIcon={<Pencil className="h-3.5 w-3.5" />}
          >
            {t('invoices.view.edit')}
          </Button>
        </div>
      </div>

      {/* Invoice Document */}
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-border bg-background shadow-sm print:border-0 print:shadow-none">
        <div className="p-4 sm:p-8">
          {/* Top Section */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              {company.logo && (
                <img
                  src={company.logo}
                  alt={company.name}
                  className="mb-2 h-14 w-auto object-contain"
                />
              )}
              <h2 className="text-xl font-bold text-foreground">{company.name}</h2>
              <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                {company.address && <p>{company.address}</p>}
                {company.country && <p>{company.country}</p>}
                {company.email && <p>{company.email}</p>}
                {company.phone && <p>{company.phone}</p>}
                {company.idType && (
                  <p>
                    {company.idType}: {company.idValue}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-2xl font-bold uppercase tracking-wider text-primary">
                {t('invoices.view.document')}
              </h3>
              <p className="mt-1 font-mono text-sm font-semibold text-foreground">
                {invoice.number}
              </p>
              <div className="mt-2">
                <Badge color={STATUS_COLOR[invoice.status]}>
                  {t(STATUS_I18N_KEY[invoice.status])}
                </Badge>
              </div>
            </div>
          </div>

          <hr className="my-6 border-border" />

          {/* Bill To & Dates */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t('invoices.view.billTo')}
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {customer?.name ?? invoice.customerName}
              </p>
              {customer && (
                <div className="mt-0.5 space-y-0.5 text-xs text-muted-foreground">
                  {customer.billingAddress && <p>{customer.billingAddress}</p>}
                  {customer.email && <p>{customer.email}</p>}
                  {customer.phone && <p>{customer.phone}</p>}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t('invoices.view.issueDate')}
                  </p>
                  <p className="text-sm text-foreground">
                    {formatDate(invoice.issueDate, 'long', i18n.language)}
                  </p>
                </div>
                {invoice.dueDate && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t('invoices.view.dueDate')}
                    </p>
                    <p className="text-sm text-foreground">
                      {formatDate(invoice.dueDate, 'long', i18n.language)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t('invoices.view.colDescription')}
                  </th>
                  <th className="pb-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t('invoices.view.colQty')}
                  </th>
                  <th className="pb-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t('invoices.view.colUnitPrice')}
                  </th>
                  <th className="pb-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t('invoices.view.colDiscount')}
                  </th>
                  <th className="pb-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t('invoices.view.colAmount')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => {
                  const lineTotal = item.quantity * item.unitPrice * (1 - item.discount / 100)
                  return (
                    <tr key={index} className="border-b border-border/50">
                      <td className="py-3">
                        <p className="font-medium text-foreground">{item.description}</p>
                      </td>
                      <td className="py-3 text-right text-foreground">{item.quantity}</td>
                      <td className="py-3 text-right font-mono text-foreground">
                        {formatCurrency(item.unitPrice, invoice.currency)}
                      </td>
                      <td className="py-3 text-right text-muted-foreground">
                        {item.discount > 0 ? `${item.discount}%` : '—'}
                      </td>
                      <td className="py-3 text-right font-mono font-semibold text-foreground">
                        {formatCurrency(lineTotal, invoice.currency)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('invoices.view.subtotal')}</span>
                <span className="font-mono text-foreground">
                  {formatCurrency(subtotal, invoice.currency)}
                </span>
              </div>
              {invoice.tax > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('invoices.view.tax')} ({invoice.tax}%)</span>
                  <span className="font-mono text-foreground">
                    {formatCurrency(taxAmt, invoice.currency)}
                  </span>
                </div>
              )}
              {invoice.discount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('invoices.view.discount')} ({invoice.discount}%)</span>
                  <span className="font-mono text-foreground">
                    − {formatCurrency(discAmt, invoice.currency)}
                  </span>
                </div>
              )}
              <hr className="border-border" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  {t('invoices.view.totalDue')}
                </span>
                <span className="text-lg font-bold font-mono text-primary">
                  {formatCurrency(total, invoice.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-8 rounded-lg bg-muted/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t('invoices.view.notes')}
              </p>
              <p className="mt-1 text-sm text-foreground">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 border-t border-border pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              {t('invoices.view.thankYou')}
              {company.name && <span> &bull; {company.name}</span>}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
