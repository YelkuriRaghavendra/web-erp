import { useMemo }                       from 'react';
import { useERPStore }                   from '../../core/store';
import { isCylinder, ym, monthLabel }    from '../../core/constants';
import { payLabel, payColor, Badge }     from '../../shared/components/ui';

// ── Tiny helpers ────────────────────────────────────────────────
const fmt = (n: number) => `₹${n.toLocaleString()}`;

// ── Metric card ─────────────────────────────────────────────────
const Card = ({
  icon, label, value, sub, color,
}: {
  icon: string; label: string; value: React.ReactNode;
  sub?: string; color?: string;
}) => (
  <div style={{
    background: 'var(--canvas)', border: '1px solid var(--border)',
    borderRadius: 14, padding: '20px 22px', boxShadow: 'var(--shadow)',
    display: 'flex', flexDirection: 'column', gap: 4,
  }}>
    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.07em', display: 'flex', gap: 6, alignItems: 'center' }}>
      <span>{icon}</span>{label}
    </div>
    <div style={{ fontSize: 22, fontWeight: 900, color: color ?? 'var(--ink)', fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2 }}>{sub}</div>}
  </div>
);

// ── Gradient hero card (for cash/bank) ───────────────────────────
const HeroCard = ({
  icon, label, value, sub, gradient, glow,
}: {
  icon: string; label: string; value: string;
  sub?: string; gradient: string; glow: string;
}) => (
  <div style={{
    borderRadius: 16, padding: '22px 26px',
    background: gradient, boxShadow: glow,
    position: 'relative', overflow: 'hidden',
  }}>
    <div style={{ position: 'absolute', top: -16, right: -16, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,.08)' }} />
    <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.7)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', fontFamily: "'JetBrains Mono',monospace", lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', marginTop: 6 }}>{sub}</div>}
  </div>
);

export const DashboardPage = () => {
  const { bills, purchases, customers, stock, items, transactions, openingBalances } = useERPStore();

  const today        = new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);

  // ── Today's stats ────────────────────────────────────────────
  const todayBills   = useMemo(() => bills.filter(b => b.date === today), [bills, today]);
  const todayRevenue = useMemo(() => todayBills.reduce((s, b) => s + b.total, 0), [todayBills]);

  // ── This month's P&L ─────────────────────────────────────────
  const {
    monthRevenue, monthCost, monthExpenses, monthNetProfit,
    monthCashSales, monthUpiSales, monthCreditSales,
  } = useMemo(() => {
    const mBills = bills.filter(b => ym(b.date) === currentMonth);
    const monthRevenue     = mBills.reduce((s, b) => s + b.total, 0);
    const monthCashSales   = mBills.filter(b => b.payment === 'Cash').reduce((s, b) => s + b.total, 0);
    const monthUpiSales    = mBills.filter(b => b.payment === 'UPI').reduce((s, b) => s + b.total, 0);
    const monthCreditSales = mBills.filter(b => b.payment === 'Credit').reduce((s, b) => s + b.total, 0);

    const mPurchases   = purchases.filter(p => ym(p.date) === currentMonth);
    const monthCost    = mPurchases.reduce((s, p) => s + p.grandTotal, 0);

    const mTxns        = transactions.filter(t => ym(t.date) === currentMonth);
    const monthExpenses = mTxns
      .filter(t => t.type === 'EXPENSE_CASH' || t.type === 'EXPENSE_BANK')
      .reduce((s, t) => s + t.amount, 0);

    const monthNetProfit = monthRevenue - monthCost - monthExpenses;
    return { monthRevenue, monthCost, monthExpenses, monthNetProfit, monthCashSales, monthUpiSales, monthCreditSales };
  }, [bills, purchases, transactions, currentMonth]);

  // ── Cash & Bank balances (current month) ────────────────────
  const { currentCash, currentBank } = useMemo(() => {
    const ob          = openingBalances[currentMonth] ?? { cash: 0, bank: 0 };
    const mBills      = bills.filter(b => ym(b.date) === currentMonth);
    const cashSales   = mBills.filter(b => b.payment === 'Cash').reduce((s, b) => s + b.total, 0);
    const upiSales    = mBills.filter(b => b.payment === 'UPI').reduce((s, b) => s + b.total, 0);
    const mTxns       = transactions.filter(t => ym(t.date) === currentMonth);
    const cashToBank  = mTxns.filter(t => t.type === 'CASH_TO_BANK').reduce((s, t) => s + t.amount, 0);
    const bankToCash  = mTxns.filter(t => t.type === 'BANK_TO_CASH').reduce((s, t) => s + t.amount, 0);
    const expCash     = mTxns.filter(t => t.type === 'EXPENSE_CASH').reduce((s, t) => s + t.amount, 0);
    const expBank     = mTxns.filter(t => t.type === 'EXPENSE_BANK').reduce((s, t) => s + t.amount, 0);
    return {
      currentCash: ob.cash + cashSales + bankToCash - cashToBank - expCash,
      currentBank: ob.bank + upiSales  + cashToBank - bankToCash - expBank,
    };
  }, [bills, transactions, openingBalances, currentMonth]);

  // ── Credit outstanding ───────────────────────────────────────
  const creditOut = useMemo(() => customers.reduce((s, c) => s + c.outstanding, 0), [customers]);
  const topDebtors = useMemo(
    () => [...customers].filter(c => c.outstanding > 0).sort((a, b) => b.outstanding - a.outstanding).slice(0, 5),
    [customers],
  );

  // ── Cylinder stock ────────────────────────────────────────────
  const cylinders = useMemo(
    () => items.filter(i => isCylinder(i.name) && i.active).map(it => ({
      ...it, qty: stock[it.id]?.qty ?? 0,
    })),
    [items, stock],
  );
  const maxQty = useMemo(() => Math.max(...cylinders.map(c => c.qty), 1), [cylinders]);

  // ── Inventory value ───────────────────────────────────────────
  const invValue = useMemo(
    () => items.reduce((s, it) => s + (stock[it.id]?.qty ?? 0) * it.price, 0),
    [items, stock],
  );

  // ── Recent bills ─────────────────────────────────────────────
  const recentBills = useMemo(() => [...bills].slice(0, 8), [bills]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Page header ────────────────────────────────── */}
      <div>
        <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--ink)' }}>Dashboard</div>
        <div style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 2 }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* ── Section label helper ─────────────────────── */}
      {/* ── TODAY ──────────────────────────────────────── */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>📅 Today</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <Card icon="📈" label="Today's Revenue"  value={fmt(todayRevenue)}       sub={`${todayBills.length} bill${todayBills.length !== 1 ? 's' : ''} today`} color="var(--accent)" />
          <Card icon="💵" label="Cash Sales"       value={fmt(monthCashSales)}     sub="This month (cash)" color="var(--green)" />
          <Card icon="📲" label="UPI / Bank Sales" value={fmt(monthUpiSales)}      sub="This month (UPI)"  color="var(--blue)"  />
          <Card icon="📋" label="Credit Sales"     value={fmt(monthCreditSales)}   sub="This month (credit)" color="var(--amber,#d97706)" />
        </div>
      </div>

      {/* ── THIS MONTH P&L ─────────────────────────────── */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>
          📊 {monthLabel(currentMonth)} — Profit & Loss
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <Card icon="💰" label="Revenue"     value={fmt(monthRevenue)}    sub="Total billed"          color="var(--green)"  />
          <Card icon="🛒" label="Purchases"   value={fmt(monthCost)}       sub="Stock bought"          color="var(--amber,#d97706)" />
          <Card icon="📤" label="Expenses"    value={fmt(monthExpenses)}   sub="Cash + bank expenses"  color="var(--red)"    />
          <div style={{
            background: monthNetProfit >= 0
              ? 'linear-gradient(135deg,#16a34a,#15803d)'
              : 'linear-gradient(135deg,#dc2626,#b91c1c)',
            borderRadius: 14, padding: '20px 22px',
            boxShadow: monthNetProfit >= 0
              ? '0 6px 20px rgba(22,163,74,.25)'
              : '0 6px 20px rgba(220,38,38,.25)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.7)', textTransform: 'uppercase', letterSpacing: '.07em', display: 'flex', gap: 6 }}>
              <span>{monthNetProfit >= 0 ? '🎯' : '⚠️'}</span>Net Profit
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', fontFamily: "'JetBrains Mono',monospace", marginTop: 6 }}>
              {monthNetProfit >= 0 ? '' : '−'}{fmt(Math.abs(monthNetProfit))}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', marginTop: 4 }}>Revenue − Purchases − Expenses</div>
          </div>
        </div>
      </div>

      {/* ── CASH & BANK + CYLINDERS ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <HeroCard icon="💵" label="Cash in Hand"   value={fmt(currentCash)} sub="Live balance this month"
          gradient="linear-gradient(135deg,#16a34a,#15803d)" glow="0 8px 24px rgba(22,163,74,.25)" />
        <HeroCard icon="🏦" label="Bank Account"   value={fmt(currentBank)} sub="Live balance this month"
          gradient="linear-gradient(135deg,#2563eb,#1d4ed8)" glow="0 8px 24px rgba(37,99,235,.25)" />
        <HeroCard icon="💼" label="Total Funds"    value={fmt(currentCash + currentBank)} sub="Cash + Bank"
          gradient="linear-gradient(135deg,#7c3aed,#6d28d9)" glow="0 8px 24px rgba(124,58,237,.25)" />
      </div>

      {/* ── CYLINDER STOCK + CREDIT OUTSTANDING + INVENTORY ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, alignItems: 'start' }}>

        {/* Cylinder stock */}
        <div style={{ background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)', marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <span>🔴 Cylinder Stock</span>
            <span style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 600 }}>Inv. {fmt(invValue)}</span>
          </div>
          {cylinders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--ink3)', fontSize: 13 }}>No cylinders found</div>
          ) : cylinders.map(c => {
            const pct = maxQty > 0 ? Math.round((c.qty / maxQty) * 100) : 0;
            return (
              <div key={c.id} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{c.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: c.qty > 0 ? 'var(--green)' : 'var(--red)', fontFamily: "'JetBrains Mono',monospace" }}>
                    {c.qty} pcs
                  </span>
                </div>
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: c.qty > 5 ? 'var(--green)' : c.qty > 0 ? 'var(--amber,#d97706)' : 'var(--red)', borderRadius: 4, transition: 'width .3s' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Top credit debtors */}
        <div style={{ background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)', marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <span>⚠️ Credit Outstanding</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: creditOut > 0 ? 'var(--red)' : 'var(--green)', fontFamily: "'JetBrains Mono',monospace" }}>{fmt(creditOut)}</span>
          </div>
          {topDebtors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--ink3)', fontSize: 13 }}>🎉 No pending dues</div>
          ) : topDebtors.map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink3)' }}>{c.phone || 'No phone'}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--red)', fontFamily: "'JetBrains Mono',monospace" }}>
                {fmt(c.outstanding)}
              </div>
            </div>
          ))}
          {customers.filter(c => c.outstanding > 0).length > 5 && (
            <div style={{ fontSize: 11, color: 'var(--ink3)', textAlign: 'center', marginTop: 4 }}>
              + {customers.filter(c => c.outstanding > 0).length - 5} more
            </div>
          )}
        </div>

        {/* Business overview */}
        <div style={{ background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)', marginBottom: 16 }}>📦 Overview</div>
          {[
            { label: 'Total Bills',      value: bills.length,      icon: '🧾', color: 'var(--accent)' },
            { label: 'Total Purchases',  value: purchases.length,  icon: '📥', color: 'var(--green)' },
            { label: 'Customers',        value: customers.length,  icon: '👥', color: 'var(--blue)' },
            { label: 'Credit Accounts',  value: customers.filter(c => c.credit).length, icon: '📋', color: 'var(--amber,#d97706)' },
            { label: 'Inventory Value',  value: fmt(invValue),     icon: '💼', color: 'var(--purple,#7c3aed)' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--ink2)' }}>{r.icon} {r.label}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: r.color, fontFamily: "'JetBrains Mono',monospace" }}>
                {typeof r.value === 'number' ? r.value.toLocaleString() : r.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RECENT BILLS ────────────────────────────────── */}
      <div style={{ background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>🧾 Recent Bills</div>
          <span style={{ fontSize: 11, color: 'var(--ink3)' }}>Latest {Math.min(8, bills.length)}</span>
        </div>
        {recentBills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ink3)', fontSize: 13 }}>No bills yet</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                {['Bill No.', 'Customer', 'Date', 'Total', 'Payment'].map(h => (
                  <th key={h} style={{ padding: '9px 16px', textAlign: h === 'Total' ? 'right' : 'left', color: 'var(--ink3)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentBills.map((b, i) => (
                <tr key={b.id}
                  style={{ borderBottom: i < recentBills.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--canvas)'}>
                  <td style={{ padding: '10px 16px', fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>{b.id.slice(0, 8).toUpperCase()}</td>
                  <td style={{ padding: '10px 16px', fontWeight: 600 }}>{b.customerName || <span style={{ color: 'var(--ink3)', fontWeight: 400, fontSize: 12 }}>Walk-in</span>}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--ink3)', fontSize: 12 }}>{b.date}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace", fontWeight: 800 }}>{fmt(b.total)}</td>
                  <td style={{ padding: '10px 16px' }}><Badge label={payLabel(b.payment)} color={payColor(b.payment)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
