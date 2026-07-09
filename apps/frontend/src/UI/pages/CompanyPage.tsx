import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyMembers } from '@/hooks/useCompanyMembers';
import { ComponentCard } from '@/UI/components/interaction';
import { Modal } from '@/UI/components/interaction/Modal';
import { DataTable } from '@/UI/components/information';
import type { ColumnDef } from '@/UI/components/information';
import { Button, Input, Label } from '@/UI/components/form';
import Badge from '@/UI/components/feedback/Badge';
import { Trash2, UserPlus } from '@/UI/helpers';
import { toast } from 'sonner';
import { fmt, getErrorMessage } from '@/UI/data/constants';
import type { BadgeColor } from '@/UI/data/constants';
import type { PaginationQuery } from '@serveless/shared/common';
import type { CompanyRole } from '@serveless/shared/company';
import type { InviteMemberDto, User } from '@serveless/shared/user';

const ROLE_COLOR: Record<CompanyRole, BadgeColor> = {
  OWNER:  'primary',
  ADMIN:  'info',
  MEMBER: 'light',
};

const ROLE_I18N_KEY: Record<CompanyRole, string> = {
  OWNER:  'company.team.roleOwner',
  ADMIN:  'company.team.roleAdmin',
  MEMBER: 'company.team.roleMember',
};

interface InviteFormState {
  fullName: string;
  email: string;
  role: InviteMemberDto['role'];
}

const EMPTY_INVITE_FORM: InviteFormState = { fullName: '', email: '', role: 'MEMBER' };

export function CompanyPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  const filters: PaginationQuery = { page, limit: 20 };
  const { data, isLoading, isError, invite, remove, isInviting } = useCompanyMembers(filters);
  const list = data;

  // The viewer's own membership decides what this page may do.
  const { user: me } = useAuth();
  const canManage = me?.company.role === 'OWNER' || me?.company.role === 'ADMIN';

  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<InviteFormState>(EMPTY_INVITE_FORM);

  const setField = <TKey extends keyof InviteFormState>(k: TKey, v: InviteFormState[TKey]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const openInvite = () => { setForm(EMPTY_INVITE_FORM); setIsOpen(true); };
  const closeModal = () => { setIsOpen(false); };

  const handleInvite = () => {
    if (!form.fullName.trim() || !form.email.trim()) return;
    invite({ fullName: form.fullName.trim(), email: form.email.trim(), role: form.role })
      .then(() => { toast.success('Invitation sent'); closeModal(); })
      .catch((err) => toast.error(getErrorMessage(err)));
  };

  const handleRemove = (id: string) =>
    remove(id)
      .then(() => toast.success('Member removed'))
      .catch((err) => toast.error(getErrorMessage(err)));

  const columns: ColumnDef<User>[] = [
    {
      key: 'fullName',
      header: t('company.team.colName'),
      cell: (r) => <span className="font-medium text-foreground">{r.fullName}</span>,
    },
    {
      key: 'email',
      header: t('company.team.colEmail'),
      cell: (r) => (
        <a href={`mailto:${r.email}`} className="text-brand-500 hover:underline text-sm">
          {r.email}
        </a>
      ),
    },
    {
      key: 'companyRole',
      header: t('company.team.colRole'),
      cell: (r) => (
        <Badge color={ROLE_COLOR[r.companyRole]} size="sm">
          {t(ROLE_I18N_KEY[r.companyRole])}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      header: t('company.team.colStatus'),
      cell: (r) => (
        <Badge color={r.isActive ? 'success' : 'error'} size="sm">
          {r.isActive ? t('company.team.active') : t('company.team.inactive')}
        </Badge>
      ),
    },
    { key: 'createdAt', header: t('company.team.colJoined'), cell: (r) => fmt(r.createdAt) },
    ...(canManage
      ? [{
          key: 'actions',
          header: '',
          headerClassName: 'w-12',
          cell: (r: User) => {
            const isOwner = r.companyRole === 'OWNER';
            const isSelf = r.uuid === me.uuid;
            return (
              <button
                onClick={() => handleRemove(r.uuid)}
                disabled={isOwner || isSelf}
                className="p-1.5 rounded-lg text-gray-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-400 disabled:hover:bg-transparent"
                title={
                  isOwner
                    ? t('company.team.removeOwner')
                    : isSelf
                      ? t('company.team.removeSelf')
                      : t('company.team.remove')
                }
              >
                <Trash2 className="size-4" />
              </button>
            );
          },
        }]
      : []),
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('company.team.title')}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('company.team.subtitle')}</p>
        </div>
        {canManage && (
          <Button onClick={openInvite} startIcon={<UserPlus className="size-4" />}>
            {t('company.team.invite')}
          </Button>
        )}
      </div>

      <ComponentCard title={t('company.team.cardTitle')}>
        <DataTable
          columns={columns}
          rows={list?.data}
          pagination={list?.pagination}
          onPageChange={setPage}
          isLoading={isLoading}
          isError={isError}
          emptyMessage={t('company.team.noMembers')}
        />
      </ComponentCard>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-lg mx-4">
        <div className="p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            {t('company.team.invite')}
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="invite-name">{t('company.team.form.fullName')}</Label>
              <Input
                id="invite-name"
                placeholder={t('company.team.form.fullNamePlaceholder')}
                value={form.fullName}
                onChange={(e) => setField('fullName', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="invite-email">{t('company.team.form.email')}</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder={t('company.team.form.emailPlaceholder')}
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="invite-role">{t('company.team.form.role')}</Label>
              <select
                id="invite-role"
                value={form.role}
                onChange={(e) => setField('role', e.target.value as InviteMemberDto['role'])}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="MEMBER">{t('company.team.roleMember')}</option>
                <option value="ADMIN">{t('company.team.roleAdmin')}</option>
              </select>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('company.team.form.hint')}
            </p>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={closeModal}>{t('common.cancel')}</Button>
              <Button
                disabled={isInviting || !form.fullName.trim() || !form.email.trim()}
                onClick={handleInvite}
              >
                {t('company.team.invite')}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
