import { Routes, Route, Navigate } from 'react-router-dom';
import { useERPStore }        from '../core/store';
import { PAGE_ROLES }         from '../core/constants';
import { AccessDenied }       from '../shared/components/AccessDenied';
import { DashboardPage }      from '../features/dashboard/DashboardPage';
import { BillingPage }        from '../features/billing/BillingPage';
import { PurchasePage }       from '../features/purchase/PurchasePage';
import { CustomersPage }      from '../features/customers/CustomersPage';
import { CreditLedgerPage }   from '../features/ledger/CreditLedgerPage';
import { ReportsPage }        from '../features/reports/ReportsPage';
import { ItemMasterPage }     from '../features/items/ItemMasterPage';
import { StaffPage }          from '../features/staff/StaffPage';
import { AccountsPage }      from '../features/accounts/AccountsPage';
import type { ERPUser, PageId } from '../core/types';

// ─────────────────────────────────────────────────────────────
//  RoleGate — security-hardened role guard
//
//  Three checks on every render:
//    1. Username exists in the staff store (not tampered)
//    2. Account is still active (instantly locked out if disabled)
//    3. Role in session matches role in store (prevents session editing)
//    4. That role is allowed on this page
// ─────────────────────────────────────────────────────────────
const RoleGate = ({
  page,
  user,
  children,
}: {
  page:     PageId;
  user:     ERPUser;
  children: React.ReactNode;
}) => {
  const staff = useERPStore(s => s.staff);

  // Re-validate session against live store data on every render
  const staffRecord = staff.find(s => s.u === user.u);

  if (
    !staffRecord ||                        // user deleted
    !staffRecord.active ||                 // account disabled
    staffRecord.role !== user.role         // role was changed or session tampered
  ) {
    return <AccessDenied />;
  }

  if (!PAGE_ROLES[page].includes(user.role)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
};

// ─────────────────────────────────────────────────────────────
//  AppRouter — all page routes in one place
// ─────────────────────────────────────────────────────────────
export const AppRouter = ({ user }: { user: ERPUser }) => (
  <Routes>
    <Route path="/"          element={<DashboardPage />} />
    <Route path="/billing"   element={<RoleGate page="billing"   user={user}><BillingPage /></RoleGate>} />
    <Route path="/purchase"  element={<RoleGate page="purchase"  user={user}><PurchasePage /></RoleGate>} />
    <Route path="/customers" element={<RoleGate page="customers" user={user}><CustomersPage /></RoleGate>} />
    <Route path="/ledger"    element={<RoleGate page="ledger"    user={user}><CreditLedgerPage /></RoleGate>} />
    <Route path="/accounts"  element={<RoleGate page="accounts"  user={user}><AccountsPage /></RoleGate>} />
    <Route path="/reports"   element={<RoleGate page="reports"   user={user}><ReportsPage /></RoleGate>} />
    <Route path="/items"     element={<RoleGate page="items"     user={user}><ItemMasterPage /></RoleGate>} />
    <Route path="/staff"     element={<RoleGate page="staff"     user={user}><StaffPage /></RoleGate>} />
    <Route path="*"          element={<Navigate to="/" replace />} />
  </Routes>
);
