import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCustomer } from '@/hooks/useCustomer';
import { ComponentCard } from '@/UI/components/interaction';
import { Modal } from '@/UI/components/interaction/Modal';
import { DataTable } from '@/UI/components/information';
import type { ColumnDef } from '@/UI/components/information';
import { Button, Input, Label } from '@/UI/components/form';
import { Pencil, Plus, Trash2 } from '@/UI/helpers';
import { toast } from 'sonner';
import { fmt, getErrorMessage, EMPTY_CUSTOMER_FORM } from '@/UI/data/constants';
import type { CustomerFormState } from '@/UI/data/constants';
import type { PaginationQuery } from '@serveless/shared/common';
import type { Customer, CreateCustomerDto } from '@serveless/shared/customer';

export function CustomersPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const filters: PaginationQuery = {
    page, limit: 20, search, sortBy: '', sortOrder: 'asc', status: 'active',
  };

  const { data, isLoading, isError, create, update, remove, isCreating, isUpdating } =
    useCustomer(filters);

  const list = data;

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerFormState>(EMPTY_CUSTOMER_FORM);

  const setField = <TKey extends keyof CustomerFormState>(k: TKey, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_CUSTOMER_FORM);
    setIsOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      name: c.name,
      email: c.email ?? '',
      phone: c.phone,
      type: c.identifier.type,
      identifier: c.identifier.value,
      billingAddress: c.billingAddress,
      shippingAddress: c.shippingAddress,
      notes: c.notes ?? '',
    });
    setIsOpen(true);
  };

  const closeModal = () => { setIsOpen(false); setEditing(null); };

  const handleSave = () => {
    if (!form.name.trim() || !form.phone.trim() || !form.type.trim() || !form.identifier.trim()) return;

    const dto: CreateCustomerDto = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      type: form.type.trim(),
      identifier: form.identifier.trim(),
      billingAddress: form.billingAddress.trim(),
      shippingAddress: form.shippingAddress.trim(),
      notes: form.notes.trim() || undefined,
      isActive: true,
    };

    const op = editing
      ? update({ id: editing.id, dto: { ...dto, uuid: editing.id } })
      : create(dto);
    op.then(() => { toast.success(editing ? 'Customer updated' : 'Customer created'); closeModal(); })
      .catch((err) => toast.error(getErrorMessage(err)));
  };

  const handleDelete = (id: string) =>
    remove(id)
      .then(() => toast.success('Customer deleted'))
      .catch((err) => toast.error(getErrorMessage(err)));

  const columns: ColumnDef<Customer>[] = [
    {
      key: 'name',
      header: t('customers.colName'),
      cell: (r) => <span className="font-medium text-foreground">{r.name}</span>,
    },
    {
      key: 'email',
      header: t('customers.colEmail'),
      cell: (r) =>
        r.email ? (
          <a href={`mailto:${r.email}`} className="text-brand-500 hover:underline">
            {r.email}
          </a>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: 'phone',
      header: t('customers.colPhone'),
      cell: (r) => r.phone || <span className="text-gray-400">—</span>,
    },
    {
      key: 'identifier',
      header: t('customers.colIdentifier'),
      cell: (r) => (
        <span className="text-sm">
          <span className="text-gray-500">{r.identifier.type}: </span>
          {r.identifier.value}
        </span>
      ),
    },
    {
      key: 'billingAddress',
      header: t('customers.colBillingAddress'),
      cell: (r) => <span className="truncate max-w-[180px] block">{r.billingAddress}</span>,
    },
    { key: 'createdAt', header: t('customers.colAdded'), cell: (r) => fmt(r.createdAt) },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-20',
      cell: (r) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openEdit(r)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => handleDelete(r.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('customers.title')}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('customers.subtitle')}</p>
        </div>
        <Button onClick={openCreate} startIcon={<Plus className="size-4" />}>
          {t('customers.add')}
        </Button>
      </div>

      <ComponentCard title={t('customers.allCustomers')}>
        <div className="mb-4">
          <Input
            placeholder={t('customers.searchPlaceholder')}
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
          emptyMessage={t('customers.noFound')}
        />
      </ComponentCard>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-lg mx-4">
        <div className="p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            {editing ? t('customers.edit') : t('customers.add')}
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cust-name">{t('customers.form.name')}</Label>
                <Input
                  id="cust-name"
                  placeholder={t('customers.form.namePlaceholder')}
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="cust-email">{t('customers.form.email')}</Label>
                <Input
                  id="cust-email"
                  type="email"
                  placeholder={t('customers.form.emailPlaceholder')}
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cust-phone">{t('customers.form.phone')}</Label>
                <Input
                  id="cust-phone"
                  placeholder={t('customers.form.phonePlaceholder')}
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="cust-id-type">{t('customers.form.idType')}</Label>
                <Input
                  id="cust-id-type"
                  placeholder={t('customers.form.idTypePlaceholder')}
                  value={form.type}
                  onChange={(e) => setField('type', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cust-identifier">{t('customers.form.idNumber')}</Label>
              <Input
                id="cust-identifier"
                placeholder={t('customers.form.idNumberPlaceholder')}
                value={form.identifier}
                onChange={(e) => setField('identifier', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="cust-billing">{t('customers.form.billingAddress')}</Label>
              <Input
                id="cust-billing"
                placeholder={t('customers.form.billingAddressPlaceholder')}
                value={form.billingAddress}
                onChange={(e) => setField('billingAddress', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="cust-shipping">{t('customers.form.shippingAddress')}</Label>
              <Input
                id="cust-shipping"
                placeholder={t('customers.form.shippingAddressPlaceholder')}
                value={form.shippingAddress}
                onChange={(e) => setField('shippingAddress', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="cust-notes">{t('customers.form.notes')}</Label>
              <Input
                id="cust-notes"
                placeholder={t('customers.form.notesPlaceholder')}
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={closeModal}>{t('common.cancel')}</Button>
              <Button
                disabled={isCreating || isUpdating || !form.name.trim() || !form.phone.trim()}
                onClick={handleSave}
              >
                {editing ? t('common.save') : t('common.create')}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
