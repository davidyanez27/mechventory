import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProduct } from '@/hooks/useProduct';
import { ComponentCard } from '@/UI/components/interaction';
import { Modal } from '@/UI/components/interaction/Modal';
import { DataTable } from '@/UI/components/information';
import type { ColumnDef } from '@/UI/components/information';
import { Button, Input, Label } from '@/UI/components/form';
import Badge from '@/UI/components/feedback/Badge';
import { Pencil, Plus, Trash2 } from '@/UI/helpers';
import { toast } from 'sonner';
import { fmt, getErrorMessage, PRODUCT_TYPES, PRODUCT_TYPE_COLOR, EMPTY_PRODUCT_FORM } from '@/UI/data/constants';
import type { ProductFormState, ProductType } from '@/UI/data/constants';
import type { PaginationQuery } from '@serveless/shared/common';
import type { Product, CreateProductDto } from '@serveless/shared/product';

export function ProductsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const filters: PaginationQuery = {
    page, limit: 20, search, sortBy: '', sortOrder: 'asc', status: 'active',
  };

  const { data, isLoading, isError, create, update, remove, isCreating, isUpdating } =
    useProduct(filters);

  const list = data;

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_PRODUCT_FORM);

  const setField = <TKey extends keyof ProductFormState>(k: TKey, v: ProductFormState[TKey]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_PRODUCT_FORM);
    setIsOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description,
      defaultPrice: String(p.defaultPrice),
      currency: p.currency,
      unit: p.unit,
      type: p.type,
    });
    setIsOpen(true);
  };

  const closeModal = () => { setIsOpen(false); setEditing(null); };

  const handleSave = () => {
    if (!form.name.trim() || !form.description.trim()) return;
    const price = parseFloat(form.defaultPrice);
    if (isNaN(price) || price < 0) return;

    const dto: CreateProductDto = {
      name: form.name.trim(),
      description: form.description.trim(),
      defaultPrice: price,
      currency: form.currency.trim() || 'USD',
      unit: form.unit.trim() || 'unit',
      type: form.type,
      isActive: true,
    };

    const op = editing && editing.uuid
      ? update({ id: editing.uuid, dto: { ...dto, uuid: editing.uuid } })
      : create(dto);
    op.then(() => { toast.success(editing ? 'Product updated' : 'Product created'); closeModal(); })
      .catch((err) => toast.error(getErrorMessage(err)));
  };

  const handleDelete = (id?: string) => {
    if (!id) return;
    remove(id)
      .then(() => toast.success('Product deleted'))
      .catch((err) => toast.error(getErrorMessage(err)));
  };

  const columns: ColumnDef<Product>[] = [
    {
      key: 'name',
      header: t('products.colName'),
      cell: (r) => <span className="font-medium text-foreground">{r.name}</span>,
    },
    {
      key: 'description',
      header: t('products.colDescription'),
      cell: (r) => (
        <span className="truncate max-w-[200px] block text-sm text-foreground">
          {r.description}
        </span>
      ),
    },
    {
      key: 'type',
      header: t('products.colType'),
      cell: (r) => (
        <Badge color={PRODUCT_TYPE_COLOR[r.type]} size="sm">
          {r.type}
        </Badge>
      ),
    },
    {
      key: 'defaultPrice',
      header: t('products.colPrice'),
      cell: (r) => (
        <span className="font-medium">
          {r.currency} {r.defaultPrice.toFixed(2)}
        </span>
      ),
    },
    { key: 'unit', header: t('products.colUnit'), cell: (r) => r.unit },
    { key: 'createdAt', header: t('products.colAdded'), cell: (r) => fmt(r.createdAt) },
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
            onClick={() => handleDelete(r.uuid)}
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
          <h1 className="text-2xl font-semibold text-foreground">{t('products.title')}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('products.subtitle')}</p>
        </div>
        <Button onClick={openCreate} startIcon={<Plus className="size-4" />}>
          {t('products.add')}
        </Button>
      </div>

      <ComponentCard title={t('products.allProducts')}>
        <div className="mb-4">
          <Input
            placeholder={t('products.searchPlaceholder')}
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
          emptyMessage={t('products.noFound')}
        />
      </ComponentCard>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-lg mx-4">
        <div className="p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            {editing ? t('products.edit') : t('products.add')}
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="prod-name">{t('products.form.name')}</Label>
              <Input
                id="prod-name"
                placeholder={t('products.form.namePlaceholder')}
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="prod-desc">{t('products.form.description')}</Label>
              <Input
                id="prod-desc"
                placeholder={t('products.form.descriptionPlaceholder')}
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prod-price">{t('products.form.defaultPrice')}</Label>
                <Input
                  id="prod-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.defaultPrice}
                  onChange={(e) => setField('defaultPrice', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="prod-currency">{t('products.form.currency')}</Label>
                <Input
                  id="prod-currency"
                  placeholder="USD"
                  value={form.currency}
                  onChange={(e) => setField('currency', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prod-unit">{t('products.form.unit')}</Label>
                <Input
                  id="prod-unit"
                  placeholder={t('products.form.unitPlaceholder')}
                  value={form.unit}
                  onChange={(e) => setField('unit', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="prod-type">{t('products.form.type')}</Label>
                <select
                  id="prod-type"
                  value={form.type}
                  onChange={(e) => setField('type', e.target.value as ProductType)}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {PRODUCT_TYPES.map((productType) => (
                    <option key={productType} value={productType}>{productType}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={closeModal}>{t('common.cancel')}</Button>
              <Button
                disabled={isCreating || isUpdating || !form.name.trim() || !form.description.trim()}
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
