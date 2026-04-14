import { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import CSS from './core/css';
import { Sidebar } from './shared/components/Sidebar';
import { Toast } from './shared/components/ui';
import { useToastStore } from './shared/hooks/useToast';
import { LoginPage } from './features/auth/LoginPage';
import { AppRouter } from './router/AppRouter';
import { useERPStore } from './core/store';
import {
  fetchCurrentUserStatus,
  fetchAllItems,
  fetchStock,
  fetchCustomers,
  fetchBills,
  fetchPurchases,
  fetchTransactions,
  fetchOpeningBalances,
  fetchDepositSettlements,
  setCurrentUser,
  runMigrations,
} from './core/supabase';
import type { ERPUser, Role } from './core/types';

// ── Valid roles — used to harden the type guard ───────────────
const VALID_ROLES: Role[] = ['Admin', 'Billing'];

// ── Session TTL: 8 hours ──────────────────────────────────────
const SESSION_TTL = 8 * 60 * 60 * 1000;

// ── Read session from storage — pure, no API calls ────────────
function readSession(): ERPUser | null {
  try {
    const parsed = JSON.parse(sessionStorage.getItem('gas-erp-user') ?? 'null');
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as ERPUser).u !== 'string' ||
      typeof (parsed as ERPUser).name !== 'string' ||
      !VALID_ROLES.includes((parsed as ERPUser).role)
    )
      return null;
    if (parsed.createdAt && Date.now() - parsed.createdAt > SESSION_TTL) {
      sessionStorage.removeItem('gas-erp-user');
      return null;
    }
    return parsed as ERPUser;
  } catch {
    return null;
  }
}

// ── Full-screen loading overlay ───────────────────────────────
const BootstrapLoader = ({ status }: { status: string }) => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
      zIndex: 9999,
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginBottom: 8,
      }}
    >
      <div
        style={{
          width: 50,
          height: 50,
          background: 'linear-gradient(145deg,#1e1008,#2d1800)',
          borderRadius: 14,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow:
            '0 6px 20px rgba(212,80,0,.4), 0 0 0 1px rgba(255,140,0,.25)',
        }}
      >
        <svg width='30' height='30' viewBox='0 0 32 32' fill='none'>
          <defs>
            <linearGradient
              id='lsga-bl'
              x1='16'
              y1='2'
              x2='16'
              y2='30'
              gradientUnits='userSpaceOnUse'
            >
              <stop offset='0%' stopColor='#FFE566' />
              <stop offset='50%' stopColor='#FF9200' />
              <stop offset='100%' stopColor='#D44500' />
            </linearGradient>
          </defs>
          <path
            d='M16 2C11 8 7 13 7 18.5C7 24.5 11.1 30 16 30C20.9 30 25 24.5 25 18.5C25 13 21 8 16 2Z'
            fill='url(#lsga-bl)'
          />
          <path
            d='M16 10C14.2 13.5 13 17 13.5 20.5C14 23.2 15 25.5 16 27C17 25.5 18 23.2 18.5 20.5C19 17 17.8 13.5 16 10Z'
            fill='rgba(255,255,255,0.42)'
          />
        </svg>
      </div>
      <div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: 'var(--ink)',
            lineHeight: 1.15,
            letterSpacing: '-.02em',
          }}
        >
          Laxmi Srinivasa
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
          Gas Agency
        </div>
      </div>
    </div>
    <div
      style={{
        width: 40,
        height: 40,
        border: '3px solid var(--border)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }}
    />
    <div style={{ fontSize: 13, color: 'var(--ink3)', fontWeight: 600 }}>
      {status}
    </div>
  </div>
);

// ── Inner app ─────────────────────────────────────────────────
const GasERPInner = () => {
  useEffect(() => {
    // Inject CSS only once
    const STYLE_ID = 'gas-erp-css';
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = CSS;
      document.head.appendChild(style);
    }
  }, []);

  // ── Mobile detection + sidebar toggle ─────────────────────
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (!e.matches) setSidebarOpen(false); // auto-close on resize to desktop
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const navigate = useNavigate();

  // ── Store setters ─────────────────────────────────────────
  const {
    setStaff,
    setItems,
    setStock,
    setCustomers,
    setBills,
    setPurchases,
    setTransactions,
    setOpeningBalances,
    setDepositSettlements,
  } = useERPStore(
    useShallow(s => ({
      setStaff: s.setStaff,
      setItems: s.setItems,
      setStock: s.setStock,
      setCustomers: s.setCustomers,
      setBills: s.setBills,
      setPurchases: s.setPurchases,
      setTransactions: s.setTransactions,
      setOpeningBalances: s.setOpeningBalances,
      setDepositSettlements: s.setDepositSettlements,
    }))
  );

  // ── Session — read INSTANTLY from storage, zero API calls ─
  const [user, setUser] = useState<ERPUser | null>(readSession);

  // ── Bootstrap — only starts AFTER a user is confirmed ─────
  // Starts as false → login page shows immediately with no API calls.
  // Flips to true only when: (a) existing session found on mount,
  //                          (b) user successfully logs in.
  const [bootstrapping, setBootstrapping] = useState(false);
  const [bootStatus, setBootStatus] = useState('Connecting to database…');
  const bootstrapRan = useRef(false);

  // Shared bootstrap function — called from effect (session restore)
  // and from handleLogin (fresh login).
  //
  // Instead of fetching ALL staff rows (which previously caused a second staff
  // network request with the full list), we now do a single lightweight query
  // for the current user's active/role status. This:
  //   • eliminates the redundant bulk staff fetch on every login/session-restore
  //   • feeds the RoleGate cross-validator with a fresh DB value (not stale session)
  //   • replaces the old "Loading staff…" step with one tiny targeted query
  //
  // Full staff list is loaded lazily in useStaff.ts when the Staff page opens.
  const doBootstrap = useCallback(async (currentUser: ERPUser) => {
    if (bootstrapRan.current) return;
    bootstrapRan.current = true;
    setBootstrapping(true);

    try {
      // ── Validate current session against DB (one-row, no password) ──
      setBootStatus('Validating session…');
      const status = await fetchCurrentUserStatus(currentUser.u);

      // Register the current user so all subsequent writes carry the correct
      // created_by / updated_by stamps on every insert and sync.
      setCurrentUser(currentUser.u);

      // Seed the staff store with a single entry for this user so the
      // RoleGate can cross-validate role + active status immediately.
      setStaff([{
        id: '',
        u: currentUser.u,
        name: currentUser.name,
        role: status?.role ?? currentUser.role,    // prefer fresh DB value
        p: '',                                      // hash never stored client-side
        active: status?.active ?? true,             // fresh from DB
        createdAt: currentUser.createdAt,
      }]);

      setBootStatus('Running migrations…');
      await runMigrations();

      setBootStatus('Loading items…');
      const items = await fetchAllItems();
      if (items.length) setItems(items);

      setBootStatus('Loading customers…');
      const customers = await fetchCustomers();
      if (customers.length) setCustomers(customers);

      setBootStatus('Loading bills & purchases…');
      const [bills, purchases] = await Promise.all([
        fetchBills(),
        fetchPurchases(),
      ]);
      if (bills.length) setBills(bills);
      if (purchases.length) setPurchases(purchases);

      // Recalculate stock from purchases (+) and bills (−) to fix any drift
      setBootStatus('Recalculating stock…');
      const stock = recalculateStock(items, purchases, bills);
      setStock(stock);

      setBootStatus('Loading accounts data…');
      const [transactions, openingBalances] = await Promise.all([
        fetchTransactions(),
        fetchOpeningBalances(),
      ]);
      if (transactions.length) setTransactions(transactions);
      if (Object.keys(openingBalances).length)
        setOpeningBalances(openingBalances);

      const settlements = await fetchDepositSettlements();
      if (settlements.length) setDepositSettlements(settlements);
    } catch (err) {
      console.error('[Bootstrap] failed:', err);
    } finally {
      setBootstrapping(false);
    }
  }, [
    setStaff,
    setItems,
    setStock,
    setCustomers,
    setBills,
    setPurchases,
    setTransactions,
    setOpeningBalances,
    setDepositSettlements,
  ]);

  // If a session was already present on mount, bootstrap immediately.
  // (No bootstrap runs if there's no session — login page shows instantly.)
  useEffect(() => {
    if (user) void doBootstrap(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Login handler ─────────────────────────────────────────
  const handleLogin = useCallback(
    (u: ERPUser) => {
      const session: ERPUser = { ...u, createdAt: Date.now() };
      sessionStorage.setItem('gas-erp-user', JSON.stringify(session));
      setUser(session);
      // Reset so bootstrap runs fresh for this login
      bootstrapRan.current = false;
      void doBootstrap(session);
    },
    [doBootstrap]
  );

  // ── Logout handler ────────────────────────────────────────
  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('gas-erp-user');
    setCurrentUser(''); // clear username so no writes carry stale audit info
    setUser(null);
    bootstrapRan.current = false;
    navigate('/', { replace: true });
  }, [navigate]);

  const { msg, type, visible } = useToastStore();

  // ── Render priority ────────────────────────────────────────
  // 1. Loader     — data is being fetched (after login or session restore)
  // 2. Login page — no session: shown INSTANTLY with ZERO API calls
  // 3. Main app   — authenticated + data ready
  if (bootstrapping) return <BootstrapLoader status={bootStatus} />;
  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        fontFamily: "'Plus Jakarta Sans',sans-serif",
      }}
    >
      {/* Mobile overlay backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.5)',
            zIndex: 199,
          }}
        />
      )}
      <Sidebar
        user={user}
        onLogout={handleLogout}
        isMobile={isMobile}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main
        style={{
          flex: 1,
          padding: isMobile ? '16px' : '28px 32px',
          overflowY: 'auto',
          background: 'var(--bg)',
          minWidth: 0,
        }}
      >
        {/* Mobile hamburger */}
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
              padding: '8px 14px',
              background: 'var(--canvas)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--ink)',
              boxShadow: 'var(--shadow)',
            }}
          >
            <span style={{ fontSize: 16 }}>☰</span> Menu
          </button>
        )}
        <AppRouter user={user} />
      </main>
      {visible && <Toast msg={msg} type={type} />}
    </div>
  );
};

export const GasERPApp = () => (
  <BrowserRouter>
    <GasERPInner />
  </BrowserRouter>
);
