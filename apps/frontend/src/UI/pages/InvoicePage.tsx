import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useInvoice, useInvoiceById } from '@/hooks/useInvoice';
import { useCustomer } from '@/hooks/useCustomer';
import { useProduct } from '@/hooks/useProduct';
import { Button, Input, Label } from '@/UI/components/form';
import DatePicker from '@/UI/components/form/Datepicker';
import Badge from '@/UI/components/feedback/Badge';
import { LoadingSpinner } from '@/UI/components/interaction/LoadingSpinner';
import { AlertCircle, ArrowLeft, Plus, Printer, Save, Trash2, X } from '@/UI/helpers';
import { openInvoicePdf } from '@/helpers/invoice.helpers';
import { toast } from 'sonner';
import {
  fmt, getErrorMessage, INVOICE_STATUSES, STATUS_COLOR, STATUS_LABEL,
  ALL_ACTIVE, SELECT_CLASS, EMPTY_LINE, lineTotal
  
} from '@/UI/data/constants';
import type {LineItem} from '@/UI/data/constants';
import type {
  InvoiceStatus, Invoice, CreateInvoiceDto, UpdateInvoiceDto,
} from '@serveless/shared/invoice';

/* ─── Types ──────────────────────────────────────────────────────────────────── */

type FormState = {
  number:    string;
  status:    InvoiceStatus;
  currency:  string;
  issueDate: string;
  dueDate:   string;
  tax:       string;
  discount:  string;
  notes:     string;
  customer:  string;
  items:     LineItem[];
};

const today = () => new Date().toISOString().split('T')[0];

const EMPTY_FORM: FormState = {
  number: '', status: 'DRAFT', currency: 'USD',
  issueDate: today(), dueDate: '',
  tax: '0', discount: '0', notes: '', customer: '',
  items: [{ ...EMPTY_LINE }],
};

/* ─── Shell ──────────────────────────────────────────────────────────────────── */

type Props = { invoiceId?: string };

export function InvoicePage({ invoiceId }: Props) {
  const isEdit = !!invoiceId;
  const { data: invoice, isLoading, isError } = useInvoiceById(invoiceId ?? '');

  if (isEdit && isLoading) return <LoadingSpinner />;
  if (isEdit && (isError || !invoice)) return <NotFound />;

  return isEdit ? <EditMode invoice={invoice!} /> : <CreateMode />;
}

/* ─── Not found ──────────────────────────────────────────────────────────────── */

function NotFound() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div className="p-6">
      <div className="rounded-xl border border-error-200 bg-error-50 dark:bg-error-500/10 p-6 text-center space-y-3">
        <AlertCircle className="size-8 text-error-500 mx-auto" />
        <p className="text-sm text-error-600 dark:text-error-400">{t('invoices.view.notFound')}</p>
        <button
          onClick={() => navigate({ to: '/invoices' })}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-medium bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-600 dark:hover:bg-gray-700 transition"
        >
          {t('invoices.form.back')}
        </button>
      </div>
    </div>
  );
}

/* ─── Edit mode — only status is editable ───────────────────────────────────── */

function EditMode({ invoice }: { invoice: Invoice }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { update, remove, isUpdating, isDeleting } = useInvoice();
  const [status, setStatus] = useState<InvoiceStatus>(invoice.status);
  const [amountPaid, setAmountPaid] = useState(String(invoice.amountPaid));
  const [paymentNotes, setPaymentNotes] = useState(invoice.paymentNotes ?? '');

  const isLocked = invoice.status === 'PAID' || invoice.status === 'CANCELED';
  const canDelete = invoice.status === 'DRAFT';
  const showPayment = status === 'PARTIALLY_PAID' || status === 'PAID';

  const subtotal = invoice.items.reduce(
    (s, it) => s + it.quantity * it.unitPrice * (1 - it.discount / 100), 0,
  );
  const taxAmt  = subtotal * (invoice.tax / 100);
  const discAmt = subtotal * (invoice.discount / 100);

  const goToView = () =>
    navigate({ to: '/invoices/$invoiceId', params: { invoiceId: invoice.id } });

  const handleSave = () => {
    const dto: UpdateInvoiceDto = {
      uuid: invoice.id,
      status,
      ...(showPayment && {
        amountPaid: parseFloat(amountPaid) || 0,
        paymentNotes: paymentNotes.trim() || undefined,
      }),
    };
    update({ id: invoice.id, dto })
      .then(() => { toast.success('Invoice updated'); goToView(); })
      .catch((err) => toast.error(getErrorMessage(err)));
  };

  const handleDelete = () =>
    remove(invoice.id)
      .then(() => { toast.success('Invoice deleted'); navigate({ to: '/invoices' }); })
      .catch((err) => toast.error(getErrorMessage(err)));

  const handleViewPdf = () =>
    openInvoicePdf(invoice.id).catch((err) => toast.error(getErrorMessage(err)));

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      {/* Top bar */}
      <div className="bg-background border-b border-border px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={goToView}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-foreground leading-tight">Invoice #{invoice.number}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Issued {fmt(invoice.issueDate)}
              {invoice.dueDate && ` · Due ${fmt(invoice.dueDate)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleViewPdf}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-border text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="size-4" /> PDF
          </button>
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 rounded-lg text-gray-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete invoice"
            >
              {isDeleting
                ? <span className="size-4 border-2 border-error-400/40 border-t-error-500 rounded-full animate-spin block" />
                : <Trash2 className="size-4" />
              }
            </button>
          )}
          <Button variant="outline" disabled={isDeleting} onClick={goToView}>{t('invoices.form.cancel')}</Button>
          <Button disabled={isLocked || isUpdating || isDeleting} onClick={handleSave}>
            {isUpdating ? (
              <span className="flex items-center gap-2">
                <span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                {t('invoices.form.saving')}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="size-4" /> {t('invoices.form.saveChanges')}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">

        {/* Status — only editable field */}
        <section className="bg-background rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">{t('invoices.form.status')}</h2>
          </div>
          <div className="p-6 flex items-center gap-4">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
              disabled={isLocked || isDeleting}
              className="w-56 h-11 rounded-lg border border-gray-300 dark:border-border bg-transparent px-4 text-sm text-gray-800 dark:text-foreground focus:outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {INVOICE_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
            <Badge color={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</Badge>
          </div>
        </section>

        {/* Payment — visible when partially paid or paid */}
        {showPayment && (
          <section className="bg-background rounded-xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">{t('invoices.form.paymentDetails')}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount-paid">{t('invoices.form.amountPaid', { currency: invoice.currency })}</Label>
                  <Input
                    id="amount-paid"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    disabled={isLocked}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Invoice total: {invoice.currency} {invoice.total.toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label htmlFor="payment-notes">{t('invoices.form.paymentNotes')}</Label>
                  <Input
                    id="payment-notes"
                    placeholder="e.g. Bank transfer #1234, partial payment"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    disabled={isLocked}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Existing payment info — read only when locked */}
        {isLocked && invoice.amountPaid > 0 && (
          <section className="bg-background rounded-xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">{t('invoices.form.paymentDetails')}</h2>
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{t('invoices.form.amountPaid', { currency: invoice.currency })}</p>
                <p className="text-sm font-semibold text-foreground">{invoice.currency} {invoice.amountPaid.toFixed(2)}</p>
              </div>
              {invoice.paymentNotes && (
                <div className="col-span-2 sm:col-span-3">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{t('invoices.form.paymentNotes')}</p>
                  <p className="text-sm text-foreground">{invoice.paymentNotes}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Invoice details — read only */}
        <section className="bg-background rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">{t('invoices.form.invoiceDetails')}</h2>
          </div>
          <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{t('invoices.form.number')}</p>
              <p className="text-sm font-semibold text-foreground">{invoice.number}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{t('invoices.form.currency')}</p>
              <p className="text-sm font-semibold text-foreground">{invoice.currency}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{t('invoices.form.issueDate')}</p>
              <p className="text-sm font-semibold text-foreground">{fmt(invoice.issueDate)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{t('invoices.form.dueDate')}</p>
              <p className="text-sm font-semibold text-foreground">{invoice.dueDate ? fmt(invoice.dueDate) : '—'}</p>
            </div>
            {invoice.customerName && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{t('invoices.form.customer')}</p>
                <p className="text-sm font-semibold text-foreground">{invoice.customerName}</p>
              </div>
            )}
            {invoice.notes && (
              <div className="col-span-2 sm:col-span-4">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{t('invoices.form.notes')}</p>
                <p className="text-sm text-foreground">{invoice.notes}</p>
              </div>
            )}
          </div>
        </section>

        {/* Line items — read only */}
        <section className="bg-background rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">{t('invoices.form.lineItems')}</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('invoices.form.description')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('invoices.form.qty')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('invoices.form.unitPrice')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('invoices.form.discPct')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('invoices.form.total')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoice.items.map((it, i) => {
                const total = it.quantity * it.unitPrice * (1 - it.discount / 100);
                return (
                  <tr key={i} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-3 text-foreground">{it.description}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-300">{it.quantity}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-300">{invoice.currency} {it.unitPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-300">{it.discount > 0 ? `${it.discount}%` : '—'}</td>
                    <td className="px-6 py-3 text-right tabular-nums font-medium text-foreground">{invoice.currency} {total.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-6 py-4 border-t border-border bg-muted/30 space-y-1.5 text-sm">
            <div className="flex justify-end gap-8 text-gray-500 dark:text-gray-400">
              <span>{t('invoices.form.subtotal')}</span>
              <span className="tabular-nums w-28 text-right">{invoice.currency} {subtotal.toFixed(2)}</span>
            </div>
            {invoice.tax > 0 && (
              <div className="flex justify-end gap-8 text-gray-500 dark:text-gray-400">
                <span>{t('invoices.form.taxPercent', { rate: invoice.tax })}</span>
                <span className="tabular-nums w-28 text-right">+ {invoice.currency} {taxAmt.toFixed(2)}</span>
              </div>
            )}
            {invoice.discount > 0 && (
              <div className="flex justify-end gap-8 text-gray-500 dark:text-gray-400">
                <span>{t('invoices.form.discountPercent', { rate: invoice.discount })}</span>
                <span className="tabular-nums w-28 text-right">− {invoice.currency} {discAmt.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-end gap-8 font-bold text-foreground border-t border-border pt-2 mt-1 text-base">
              <span>{t('invoices.form.total')}</span>
              <span className="tabular-nums w-28 text-right">{invoice.currency} {invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ─── Create mode — full form ────────────────────────────────────────────────── */

function CreateMode() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { create, isCreating } = useInvoice();
  const { data: customerData } = useCustomer(ALL_ACTIVE);
  const { data: productData }  = useProduct(ALL_ACTIVE);
  const customers = customerData?.data ?? [];
  const products  = productData?.data  ?? [];

  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const setField = <TKey extends keyof FormState>(k: TKey, v: FormState[TKey]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const setLineField = (idx: number, key: keyof LineItem, val: string) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((item, i) => (i === idx ? { ...item, [key]: val } : item)),
    }));

  const addLine    = () => setForm((f) => ({ ...f, items: [...f.items, { ...EMPTY_LINE }] }));
  const removeLine = (idx: number) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const subtotal = form.items.reduce((s, it) => s + lineTotal(it), 0);
  const taxAmt   = subtotal * ((parseFloat(form.tax)      || 0) / 100);
  const discAmt  = subtotal * ((parseFloat(form.discount) || 0) / 100);
  const total    = subtotal + taxAmt - discAmt;

  // lineTotal is computed server-side, so the payload uses the create-items
  // shape, not the full InvoiceItem.
  const computedItems = (): CreateInvoiceDto['items'] =>
    form.items
      .filter((it) => it.description.trim())
      .map((it) => ({
        description: it.description.trim(),
        quantity:    parseFloat(it.quantity)  || 1,
        unitPrice:   parseFloat(it.unitPrice) || 0,
        discount:    parseFloat(it.discount)  || 0,
      }));

  const hasItems = computedItems().length > 0;
  const isValid = !!form.customer && !!form.dueDate && hasItems;

  const handleSubmit = () => {
    if (!isValid) return;
    const dto: CreateInvoiceDto = {
      status:    form.status,
      currency:  form.currency.trim() || 'USD',
      issueDate: new Date(form.issueDate).toISOString(),
      dueDate:   new Date(form.dueDate).toISOString(),
      tax:       parseFloat(form.tax)      || 0,
      discount:  parseFloat(form.discount) || 0,
      notes:     form.notes.trim() || undefined,
      customer:  form.customer,
      items:     computedItems(),
    };
    create(dto)
      .then(() => { toast.success('Invoice created'); navigate({ to: '/invoices' }); })
      .catch((err) => toast.error(getErrorMessage(err)));
  };

  const selectedCustomer = customers.find((c) => c.id === form.customer);

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      {/* Top bar */}
      <div className="bg-background border-b border-border px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: '/invoices' })}
            className="p-1.5 rounded-lg text-gray-400 hover:text-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-foreground leading-tight">{t('invoices.form.newInvoice')}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('invoices.form.autoNumber')} ·{' '}
              <Badge color={STATUS_COLOR[form.status]} size="sm">{STATUS_LABEL[form.status]}</Badge>
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-6 items-start">

        {/* Left */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Invoice Details */}
          <section className="bg-background rounded-xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">{t('invoices.form.invoiceDetails')}</h2>
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="inv-status">{t('invoices.form.status')}</Label>
                <select id="inv-status" value={form.status}
                  onChange={(e) => setField('status', e.target.value as InvoiceStatus)}
                  className={SELECT_CLASS}>
                  {INVOICE_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="inv-currency">{t('invoices.form.currency')}</Label>
                <Input id="inv-currency" placeholder="USD"
                  value={form.currency} onChange={(e) => setField('currency', e.target.value.toUpperCase())} />
              </div>
              <div>
                <DatePicker id="inv-issue" label={t('invoices.form.issueDate')}
                  defaultDate={form.issueDate} placeholder="YYYY-MM-DD"
                  onChange={(_, dateStr) => setField('issueDate', dateStr)} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <DatePicker id="inv-due" label={t('invoices.form.dueDate')}
                  defaultDate={form.dueDate || undefined} placeholder="YYYY-MM-DD"
                  onChange={(_, dateStr) => setField('dueDate', dateStr)} />
              </div>
            </div>
          </section>

          {/* Customer */}
          <section className="bg-background rounded-xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">{t('invoices.form.customer')} <span className="text-error-500">*</span></h2>
            </div>
            <div className="p-6 space-y-3">
              <select value={form.customer}
                onChange={(e) => setField('customer', e.target.value)}
                className={SELECT_CLASS}>
                <option value="">{t('invoices.form.selectCustomer')}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.email ? `  ·  ${c.email}` : ''}</option>
                ))}
              </select>
              {selectedCustomer && (
                <div className="rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 px-4 py-3 flex items-start gap-3">
                  <div className="size-8 rounded-full bg-brand-500 flex items-center justify-center text-white dark:text-black text-xs font-bold shrink-0 mt-0.5">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{selectedCustomer.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {selectedCustomer.email && <span>{selectedCustomer.email} · </span>}
                      {selectedCustomer.phone}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{selectedCustomer.billingAddress}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Line Items */}
          <section className="bg-background rounded-xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">{t('invoices.form.lineItems')} <span className="text-error-500">*</span></h2>
              <button type="button" onClick={addLine}
                className="flex items-center gap-1.5 text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors">
                <Plus className="size-3.5" /> {t('invoices.form.addLine')}
              </button>
            </div>
            <div className="hidden sm:grid grid-cols-[1fr_80px_100px_80px_90px_32px] gap-x-3 px-6 py-2.5 bg-muted/50 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              <span>{t('invoices.form.description')}</span>
              <span className="text-right">{t('invoices.form.qty')}</span>
              <span className="text-right">{t('invoices.form.unitPrice')}</span>
              <span className="text-right">{t('invoices.form.discPct')}</span>
              <span className="text-right">{t('invoices.form.total')}</span>
              <span />
            </div>
            <div className="divide-y divide-border">
              {form.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_80px_100px_80px_90px_32px] gap-x-3 gap-y-2 px-6 py-3 items-center">
                  <select
                    value={products.find((p) => p.name === item.description)?.uuid ?? ''}
                    onChange={(e) => {
                      const selected = products.find((p) => p.uuid === e.target.value);
                      if (selected) {
                        setLineField(idx, 'description', selected.name);
                        setLineField(idx, 'unitPrice', String(selected.defaultPrice));
                      }
                    }}
                    className={SELECT_CLASS}
                  >
                    <option value="">{t('invoices.form.selectProduct')}</option>
                    {products.map((p) => (
                      <option key={p.uuid} value={p.uuid}>{p.name} · {p.currency} {p.defaultPrice}</option>
                    ))}
                  </select>
                  <Input type="number" min="0" step="1" placeholder="1" value={item.quantity}
                    onChange={(e) => setLineField(idx, 'quantity', e.target.value)} className="text-right" />
                  <Input type="number" min="0" step="0.01" placeholder="0.00" value={item.unitPrice}
                    onChange={(e) => setLineField(idx, 'unitPrice', e.target.value)} className="text-right" />
                  <Input type="number" min="0" max="100" step="0.01" placeholder="0" value={item.discount}
                    onChange={(e) => setLineField(idx, 'discount', e.target.value)} className="text-right" />
                  <div className="text-right text-sm font-semibold text-foreground tabular-nums py-2 sm:py-0">
                    {form.currency} {lineTotal(item).toFixed(2)}
                  </div>
                  <div className="flex justify-end sm:justify-center">
                    {form.items.length > 1 && (
                      <button type="button" onClick={() => removeLine(idx)}
                        className="p-1 rounded text-gray-300 hover:text-error-500 transition-colors">
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 border-t border-border bg-muted/30 flex justify-end">
              <span className="text-xs text-gray-500 dark:text-gray-400 mr-6">{t('invoices.form.subtotal')}</span>
              <span className="text-sm font-semibold text-foreground tabular-nums w-[90px] text-right">
                {form.currency} {subtotal.toFixed(2)}
              </span>
            </div>
          </section>

          {/* Notes */}
          <section className="bg-background rounded-xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">{t('invoices.form.notes')}</h2>
            </div>
            <div className="p-6">
              <textarea rows={3}
                placeholder="Payment terms, bank details, or any additional information…"
                value={form.notes} onChange={(e) => setField('notes', e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-border bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:text-foreground placeholder:text-gray-400 dark:placeholder:text-muted-foreground focus:outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:focus:border-brand-500 resize-none"
              />
            </div>
          </section>
        </div>

        {/* Right — sticky summary */}
        <div className="w-full lg:w-72 shrink-0 space-y-4 lg:sticky lg:top-6">
          <section className="bg-background rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">{t('invoices.form.adjustments')}</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <Label htmlFor="inv-tax">{t('invoices.form.tax')}</Label>
                <Input id="inv-tax" type="number" min="0" max="100" step="0.01" placeholder="0"
                  value={form.tax} onChange={(e) => setField('tax', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="inv-disc">{t('invoices.form.discount')}</Label>
                <Input id="inv-disc" type="number" min="0" max="100" step="0.01" placeholder="0"
                  value={form.discount} onChange={(e) => setField('discount', e.target.value)} />
              </div>
            </div>
          </section>

          <section className="bg-background rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">{t('invoices.form.summary')}</h2>
            </div>
            <div className="p-5 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>{t('invoices.form.subtotal')}</span>
                <span className="tabular-nums font-medium text-foreground">{form.currency} {subtotal.toFixed(2)}</span>
              </div>
              {parseFloat(form.tax) > 0 && (
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>{t('invoices.form.taxPercent', { rate: form.tax })}</span>
                  <span className="tabular-nums">+ {form.currency} {taxAmt.toFixed(2)}</span>
                </div>
              )}
              {parseFloat(form.discount) > 0 && (
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>{t('invoices.form.discountPercent', { rate: form.discount })}</span>
                  <span className="tabular-nums">− {form.currency} {discAmt.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-foreground border-t border-border pt-3 mt-1 text-base">
                <span>{t('invoices.form.total')}</span>
                <span className="tabular-nums">{form.currency} {total.toFixed(2)}</span>
              </div>
            </div>
          </section>

          <Button disabled={isCreating || !isValid} onClick={handleSubmit} className="w-full justify-center">
            {isCreating ? (
              <span className="flex items-center gap-2">
                <span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                {t('invoices.form.creating')}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="size-4" /> {t('invoices.form.createInvoice')}
              </span>
            )}
          </Button>

          {!isValid && (
            <p className="text-xs text-center text-gray-400 dark:text-gray-500">
              {!form.number.trim() && !form.customer
                ? 'Add an invoice number and select a customer.'
                : !form.number.trim() ? 'Add an invoice number.' : 'Select a customer.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
