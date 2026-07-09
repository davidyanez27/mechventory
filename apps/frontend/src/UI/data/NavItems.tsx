import { useTranslation } from 'react-i18next';
import { Building2, FileText, LayoutGrid, Package, User, Users } from '@/UI/helpers';

export interface NavItem {
  name: string;
  icon?: React.ReactNode;
  path?: string;
  subItems?: SubItem[];
}

export type SubItem = {
  name: string;
  path: string;
};

export function useNavItems(): NavItem[] {
  const { t } = useTranslation();
  return [
    {
      icon: <LayoutGrid />,
      name: t('nav.dashboard'),
      path: '/dashboard',
    },
    {
      icon: <FileText />,
      name: t('nav.invoices'),
      subItems: [
        { name: t('nav.newInvoice'), path: '/invoices/create' },
        { name: t('nav.invoices'), path: '/invoices' },
      ],
    },
    {
      icon: <Users />,
      name: t('nav.customers'),
      path: '/customers',
    },
    {
      icon: <Package />,
      name: t('nav.products'),
      path: '/products',
    },
    {
      icon: <Building2 />,
      name: t('nav.myCompany'),
      path: '/company',
    },
    {
      icon: <User />,
      name: t('nav.profile'),
      path: '/profile',
    },
  ];
}
