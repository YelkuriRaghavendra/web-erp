import type { Role, PageId } from './types';

// Navigation — sidebar items with role guards + URL paths
export const NAV = [
  {
    id: 'dashboard' as PageId,
    path: '/',
    icon: '▦',
    label: 'Dashboard',
    roles: ['Admin'] as Role[],
  },
  {
    id: 'billing' as PageId,
    path: '/billing',
    icon: '🧾',
    label: 'Billing',
    roles: ['Admin', 'Billing'] as Role[],
  },
  {
    id: 'purchase' as PageId,
    path: '/purchase',
    icon: '⊞',
    label: 'Purchase',
    roles: ['Admin', 'Billing'] as Role[],
  },
  {
    id: 'customers' as PageId,
    path: '/customers',
    icon: '👥',
    label: 'Customers',
    roles: ['Admin'] as Role[],
  },
  {
    id: 'ledger' as PageId,
    path: '/ledger',
    icon: '⊟',
    label: 'Credit Ledger',
    roles: ['Admin', 'Billing'] as Role[],
  },
  {
    id: 'accounts' as PageId,
    path: '/accounts',
    icon: '💰',
    label: 'Cash & Bank',
    roles: ['Admin'] as Role[],
  },
  {
    id: 'reports' as PageId,
    path: '/reports',
    icon: '◫',
    label: 'Reports',
    roles: ['Admin'] as Role[],
  },
  {
    id: 'items' as PageId,
    path: '/items',
    icon: '≡',
    label: 'Item Master',
    roles: ['Admin'] as Role[],
  },
  {
    id: 'staff' as PageId,
    path: '/staff',
    icon: '👤',
    label: 'Staff',
    roles: ['Admin'] as Role[],
  },
];

// Strongly-typed role map — PageId keys, Role[] values
export const PAGE_ROLES: Record<PageId, Role[]> = {
  dashboard: ['Admin'],
  billing: ['Admin', 'Billing'],
  purchase: ['Admin', 'Billing'],
  customers: ['Admin'],
  ledger: ['Admin', 'Billing'],
  accounts: ['Admin'],
  reports: ['Admin'],
  items: ['Admin'],
  staff: ['Admin'],
};

// ── Date helpers ─────────────────────────────────────────────
export const ym = (date: string) => date.slice(0, 7);

export const monthLabel = (ymStr: string) => {
  const [y, m] = ymStr.split('-');
  return new Date(+y, +m - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
};

export const allMonths = (
  bills: { date: string }[],
  purchases: { date: string }[]
) => {
  const set = new Set([
    ...bills.map(b => ym(b.date)),
    ...purchases.map(p => ym(p.date)),
  ]);
  return [...set].sort().reverse();
};
