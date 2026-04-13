import { useMemo, useState } from 'react';
import { useERPStore } from '../../core/store';
import { ym, monthLabel } from '../../core/constants';
import { payLabel, payColor, Badge } from '../../shared/components/ui';

// ── Tiny helpers ────────────────────────────────────────────────
const fmt = (n: number) => `₹${n.toLocaleString()}`;

// ── Metric card ─────────────────────────────────────────────────
const Card = ({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: string;
  label: string;
  value: React.ReactNode;
  sub?: string;
  color?: string;
}) => (
  <div
    style={{
      background: 'var(--canvas)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '20px 22px',
      boxShadow: 'var(--shadow)',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}
  >
    <div
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--ink3)',
        textTransform: 'uppercase',
        letterSpacing: '.07em',
        display: 'flex',
        gap: 6,
        alignItems: 'center',
      }}
    >
      <span>{icon}</span>
      {label}
    </div>
    <div
      style={{
        fontSize: 22,
        fontWeight: 900,
        color: color ?? 'var(--ink)',
        fontFamily: "'JetBrains Mono',monospace",
        marginTop: 2,
      }}
    >
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2 }}>
        {sub}
      </div>
    )}
  </div>
);

// ── Gradient hero card (for cash/bank) ───────────────────────────
const HeroCard = ({
  icon,
  label,
  value,
  sub,
  gradient,
  glow,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  gradient: string;
  glow: string;
}) => (
  <div
    style={{
      borderRadius: 16,
      padding: '22px 26px',
      background: gradient,
      boxShadow: glow,
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: -16,
        right: -16,
        width: 70,
        height: 70,
        borderRadius: '50%',
        background: 'rgba(255,255,255,.08)',
      }}
    />
    <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: 'rgba(255,255,255,.7)',
        textTransform: 'uppercase',
        letterSpacing: '.08em',
        marginBottom: 4,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 28,
        fontWeight: 900,
        color: '#fff',
        fontFamily: "'JetBrains Mono',monospace",
        lineHeight: 1,
      }}
    >
      {value}
    </div>
    {sub && (
      <div
        style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', marginTop: 6 }}
      >
        {sub}
      </div>
    )}
  </div>
);

export const DashboardPage = () => {
  const {
    bills,
    purchases,
    customers,
    stock,
    items,
    transactions,
    openingBalances,
  } = useERPStore();

  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(thisMonth);
  const currentMonth = selectedMonth;

  const prevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const nextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m, 1);
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (next <= thisMonth) setSelectedMonth(next);
  };

  // ── Today's stats ────────────────────────────────────────────
  const todayBills = useMemo(
    () => bills.filter(b => b.date === today),
    [bills, today]
  );
  const { todayRevenue, todayCash, todayUPI, todayCredit } = useMemo(() => ({
    todayRevenue: todayBills.reduce((s, b) => s + b.total, 0),
    todayCash: todayBills.filter(b => b.payment === 'Cash').reduce((s, b) => s + b.total, 0),
    todayUPI: todayBills.filter(b => b.payment === 'UPI').reduce((s, b) => s + b.total, 0),
    todayCredit: todayBills.filter(b => b.payment === 'Credit').reduce((s, b) => s + b.total, 0),
  }), [todayBills]);

  // ── This month's P&L ─────────────────────────────────────────
  const {
    monthRevenue,
    monthCost,
    monthExpenses,
    monthNetProfit,
    monthCashSales,
    monthUpiSales,
    monthCreditSales,
  } = useMemo(() => {
    const mBills = bills.filter(b => ym(b.date) === currentMonth);
    const monthRevenue = mBills.reduce((s, b) => s + b.total, 0);
    const monthCashSales = mBills
      .filter(b => b.payment === 'Cash')
      .reduce((s, b) => s + b.total, 0);
    const monthUpiSales = mBills
      .filter(b => b.payment === 'UPI')
      .reduce((s, b) => s + b.total, 0);
    const monthCreditSales = mBills
      .filter(b => b.payment === 'Credit')
      .reduce((s, b) => s + b.total, 0);

    const mPurchases = purchases.filter(p => ym(p.date) === currentMonth);
    const monthCost = mPurchases.reduce((s, p) => s + p.grandTotal, 0);

    const mTxns = transactions.filter(t => ym(t.date) === currentMonth);
    const monthExpenses = mTxns
      .filter(t => t.type === 'EXPENSE_CASH' || t.type === 'EXPENSE_BANK')
      .reduce((s, t) => s + t.amount, 0);

    const monthGrossProfit = monthRevenue - monthCost;
    const monthNetProfit = monthRevenue - monthCost - monthExpenses;
    return {
      monthRevenue,
      monthCost,
      monthExpenses,
      monthGrossProfit,
      monthNetProfit,
      monthCashSales,
      monthUpiSales,
      monthCreditSales,
    };
  }, [bills, purchases, transactions, currentMonth]);

  // ── Cash & Bank balances (current month) ────────────────────
  const { currentCash, currentBank, cashOB, bankOB } = useMemo(() => {
    const ob = openingBalances[currentMonth] ?? { cash: 0, bank: 0 };
    const mBills = bills.filter(b => ym(b.date) === currentMonth);
    const cashSales = mBills.filter(b => b.payment === 'Cash').reduce((s, b) => s + b.total, 0);
    const upiSales = mBills.filter(b => b.payment === 'UPI').reduce((s, b) => s + b.total, 0);
    const mTxns = transactions.filter(t => ym(t.date) === currentMonth);
    const cashToBank = mTxns.filter(t => t.type === 'CASH_TO_BANK').reduce((s, t) => s + t.amount, 0);
    const bankToCash = mTxns.filter(t => t.type === 'BANK_TO_CASH').reduce((s, t) => s + t.amount, 0);
    const expCash = mTxns.filter(t => t.type === 'EXPENSE_CASH').reduce((s, t) => s + t.amount, 0);
    const expBank = mTxns.filter(t => t.type === 'EXPENSE_BANK').reduce((s, t) => s + t.amount, 0);
    const addToBank = mTxns.filter(t => t.type === 'ADD_TO_BANK').reduce((s, t) => s + t.amount, 0);
    const addToCash = mTxns.filter(t => t.type === 'ADD_TO_CASH').reduce((s, t) => s + t.amount, 0);
    return {
      cashOB: ob.cash,
      bankOB: ob.bank,
      currentCash: ob.cash + cashSales + bankToCash + addToCash - cashToBank - expCash,
      currentBank: ob.bank + upiSales + cashToBank + addToBank - bankToCash - expBank,
    };
  }, [bills, transactions, openingBalances, currentMonth]);

  // ── Credit outstanding ───────────────────────────────────────
  const creditOut = useMemo(
    () => customers.reduce((s, c) => s + c.outstanding, 0),
    [customers]
  );
  const topDebtors = useMemo(
    () =>
      [...customers]
        .filter(c => c.outstanding > 0)
        .sort((a, b) => b.outstanding - a.outstanding)
        .slice(0, 5),
    [customers]
  );

  // ── Cylinder stock ────────────────────────────────────────────
  const cylinders = useMemo(
    () =>
      items
        .filter(i => i.itemType === 'cylinder' && i.active)
        .map(it => ({
          ...it,
          qty: stock[it.id]?.qty ?? 0,
        })),
    [items, stock]
  );
  const maxQty = useMemo(
    () => Math.max(...cylinders.map(c => c.qty), 1),
    [cylinders]
  );

  // ── Inventory value ───────────────────────────────────────────
  const invValue = useMemo(
    () => items.reduce((s, it) => s + (stock[it.id]?.qty ?? 0) * (it.prices[0]?.price ?? 0), 0),
    [items, stock]
  );

  // ── Items sold this month ────────────────────────────────────
  const itemsSold = useMemo(() => {
    const mBills = bills.filter(b => ym(b.date) === currentMonth);
    const map: Record<string, { name: string; qty: number; amount: number }> = {};
    mBills.forEach(b => {
      b.lines.forEach(l => {
        if (!map[l.itemId]) map[l.itemId] = { name: l.itemName, qty: 0, amount: 0 };
        map[l.itemId].qty += l.qty;
        map[l.itemId].amount += l.amount + l.qty * (l.deposit ?? 0);
      });
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty);
  }, [bills, currentMonth]);

  // ── Recent bills ─────────────────────────────────────────────
  const recentBills = useMemo(() => [...bills].slice(0, 8), [bills]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Page header ────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--ink)' }}>
            Dashboard
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 2 }}>
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={prevMonth}
            style={{ border: '1px solid var(--border)', background: 'var(--canvas)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 16, color: 'var(--ink2)' }}
          >‹</button>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', minWidth: 90, textAlign: 'center' }}>
            {monthLabel(selectedMonth)}
          </span>
          <button
            onClick={nextMonth}
            disabled={selectedMonth >= thisMonth}
            style={{ border: '1px solid var(--border)', background: 'var(--canvas)', borderRadius: 8, padding: '6px 12px', cursor: selectedMonth >= thisMonth ? 'not-allowed' : 'pointer', fontSize: 16, color: selectedMonth >= thisMonth ? 'var(--ink3)' : 'var(--ink2)', opacity: selectedMonth >= thisMonth ? 0.4 : 1 }}
          >›</button>
        </div>
      </div>

      {/* ── TODAY (only when viewing current month) ─────── */}
      {selectedMonth === thisMonth ? <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: 'var(--ink3)',
            textTransform: 'uppercase',
            letterSpacing: '.1em',
            marginBottom: 12,
          }}
        >
          📅 Today
        </div>
        <div className="erp-grid-4">
          <Card
            icon='📈'
            label="Today's Revenue"
            value={fmt(todayRevenue)}
            sub={`${todayBills.length} bill${todayBills.length !== 1 ? 's' : ''} today`}
            color='var(--accent)'
          />
          <Card
            icon='💵'
            label="Today's Cash"
            value={fmt(todayCash)}
            sub='Cash collected today'
            color='var(--green)'
          />
          <Card
            icon='📲'
            label="Today's UPI"
            value={fmt(todayUPI)}
            sub='UPI / Online today'
            color='var(--blue)'
          />
          <Card
            icon='📋'
            label="Today's Credit"
            value={fmt(todayCredit)}
            sub='Credit given today'
            color='var(--amber,#d97706)'
          />
        </div>
      </div> : null}

      {/* ── THIS MONTH P&L ─────────────────────────────── */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: 'var(--ink3)',
            textTransform: 'uppercase',
            letterSpacing: '.1em',
            marginBottom: 12,
          }}
        >
          📊 {monthLabel(currentMonth)} — Profit & Loss
        </div>
        <div className="erp-grid-4">
          <Card
            icon='💰'
            label='Revenue'
            value={fmt(monthRevenue)}
            sub='Total billed'
            color='var(--green)'
          />
          <Card
            icon='🛒'
            label='Purchases'
            value={fmt(monthCost)}
            sub='Stock bought'
            color='var(--amber,#d97706)'
          />
          <Card
            icon='📤'
            label='Expenses'
            value={fmt(monthExpenses)}
            sub='Cash + bank expenses'
            color='var(--red)'
          />
          <div
            style={{
              background: monthNetProfit >= 0
                ? 'linear-gradient(135deg,#16a34a,#15803d)'
                : 'linear-gradient(135deg,#dc2626,#b91c1c)',
              borderRadius: 14,
              padding: '20px 22px',
              boxShadow: monthNetProfit >= 0
                ? '0 6px 20px rgba(22,163,74,.25)'
                : '0 6px 20px rgba(220,38,38,.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.7)', textTransform: 'uppercase', letterSpacing: '.07em', display: 'flex', gap: 6 }}>
              <span>{monthNetProfit >= 0 ? '🎯' : '⚠️'}</span>Net Profit
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>
              {monthNetProfit >= 0 ? '' : '−'}{fmt(Math.abs(monthNetProfit))}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', marginTop: 2 }}>
              Revenue - Purchases - Expenses
            </div>
          </div>
        </div>
      </div>

      {/* ── THIS MONTH SALES BREAKDOWN ─────────────────── */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: 'var(--ink3)',
            textTransform: 'uppercase',
            letterSpacing: '.1em',
            marginBottom: 12,
          }}
        >
          💰 {monthLabel(currentMonth)} — Sales Breakdown
        </div>
        <div className="erp-grid-3">
          <Card icon='💵' label='Month Cash Sales' value={fmt(monthCashSales)} sub='Total cash collected' color='var(--green)' />
          <Card icon='📲' label='Month UPI Sales' value={fmt(monthUpiSales)} sub='Total UPI / online' color='var(--blue)' />
          <Card icon='📋' label='Month Credit Sales' value={fmt(monthCreditSales)} sub='Total billed on credit' color='var(--amber,#d97706)' />
        </div>
      </div>

      {/* ── CASH & BANK ─────────────────────────────────── */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: 'var(--ink3)',
            textTransform: 'uppercase',
            letterSpacing: '.1em',
            marginBottom: 12,
          }}
        >
          🏦 Cash & Bank — Live Balances
        </div>
        <div className="erp-grid-3">
          <HeroCard
            icon='💵'
            label='Cash in Hand'
            value={fmt(currentCash)}
            sub={`OB: ${fmt(cashOB)} · Closing balance`}
            gradient={currentCash >= 0 ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#dc2626,#b91c1c)'}
            glow={currentCash >= 0 ? '0 8px 24px rgba(22,163,74,.25)' : '0 8px 24px rgba(220,38,38,.25)'}
          />
          <HeroCard
            icon='🏦'
            label='Bank Account'
            value={fmt(currentBank)}
            sub={`OB: ${fmt(bankOB)} · Closing balance`}
            gradient={currentBank >= 0 ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : 'linear-gradient(135deg,#dc2626,#b91c1c)'}
            glow={currentBank >= 0 ? '0 8px 24px rgba(37,99,235,.25)' : '0 8px 24px rgba(220,38,38,.25)'}
          />
          <HeroCard
            icon='💼'
            label='Total Funds'
            value={fmt(currentCash + currentBank)}
            sub={`Cash ${fmt(currentCash)} + Bank ${fmt(currentBank)}`}
            gradient={currentCash + currentBank >= 0 ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'linear-gradient(135deg,#dc2626,#b91c1c)'}
            glow={currentCash + currentBank >= 0 ? '0 8px 24px rgba(124,58,237,.25)' : '0 8px 24px rgba(220,38,38,.25)'}
          />
        </div>
      </div>

      {/* ── CYLINDER STOCK + CREDIT OUTSTANDING + INVENTORY ── */}
      <div className="erp-grid-3" style={{ gap: 16, alignItems: 'start' }}>
        {/* Cylinder stock */}
        <div
          style={{
            background: 'var(--canvas)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '20px 22px',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: 'var(--ink)',
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>🔴 Cylinder Stock</span>
            <span
              style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 600 }}
            >
              Inv. {fmt(invValue)}
            </span>
          </div>
          {cylinders.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '24px 0',
                color: 'var(--ink3)',
                fontSize: 13,
              }}
            >
              No cylinders found
            </div>
          ) : (
            cylinders.map(c => {
              const pct = maxQty > 0 ? Math.round((c.qty / maxQty) * 100) : 0;
              return (
                <div key={c.id} style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 5,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--ink)',
                      }}
                    >
                      {c.name}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: c.qty > 0 ? 'var(--green)' : 'var(--red)',
                        fontFamily: "'JetBrains Mono',monospace",
                      }}
                    >
                      {c.qty} pcs
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: 'var(--border)',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background:
                          c.qty > 5
                            ? 'var(--green)'
                            : c.qty > 0
                              ? 'var(--amber,#d97706)'
                              : 'var(--red)',
                        borderRadius: 4,
                        transition: 'width .3s',
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Top credit debtors */}
        <div
          style={{
            background: 'var(--canvas)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '20px 22px',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: 'var(--ink)',
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>⚠️ Credit Outstanding</span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 900,
                color: creditOut > 0 ? 'var(--red)' : 'var(--green)',
                fontFamily: "'JetBrains Mono',monospace",
              }}
            >
              {fmt(creditOut)}
            </span>
          </div>
          {topDebtors.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '24px 0',
                color: 'var(--ink3)',
                fontSize: 13,
              }}
            >
              🎉 No pending dues
            </div>
          ) : (
            topDebtors.map(c => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--ink)',
                    }}
                  >
                    {c.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink3)' }}>
                    {c.phone || 'No phone'}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: 'var(--red)',
                    fontFamily: "'JetBrains Mono',monospace",
                  }}
                >
                  {fmt(c.outstanding)}
                </div>
              </div>
            ))
          )}
          {customers.filter(c => c.outstanding > 0).length > 5 && (
            <div
              style={{
                fontSize: 11,
                color: 'var(--ink3)',
                textAlign: 'center',
                marginTop: 4,
              }}
            >
              + {customers.filter(c => c.outstanding > 0).length - 5} more
            </div>
          )}
        </div>

        {/* Business overview */}
        <div
          style={{
            background: 'var(--canvas)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '20px 22px',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: 'var(--ink)',
              marginBottom: 16,
            }}
          >
            📦 Overview
          </div>
          {[
            {
              label: 'Total Bills',
              value: bills.length,
              icon: '🧾',
              color: 'var(--accent)',
            },
            {
              label: 'Total Purchases',
              value: purchases.length,
              icon: '📥',
              color: 'var(--green)',
            },
            {
              label: 'Customers',
              value: customers.length,
              icon: '👥',
              color: 'var(--blue)',
            },
            {
              label: 'Credit Accounts',
              value: customers.filter(c => c.credit).length,
              icon: '📋',
              color: 'var(--amber,#d97706)',
            },
            {
              label: 'Inventory Value',
              value: fmt(invValue),
              icon: '💼',
              color: 'var(--purple,#7c3aed)',
            },
          ].map(r => (
            <div
              key={r.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--ink2)' }}>
                {r.icon} {r.label}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: r.color,
                  fontFamily: "'JetBrains Mono',monospace",
                }}
              >
                {typeof r.value === 'number'
                  ? r.value.toLocaleString()
                  : r.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── ITEMS SOLD THIS MONTH ─────────────────────── */}
      <div
        style={{
          background: 'var(--canvas)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: 'var(--shadow)',
        }}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 800, fontSize: 13 }}>📦 Items Sold — {monthLabel(currentMonth)}</span>
          <span style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 600 }}>
            {itemsSold.reduce((s, i) => s + i.qty, 0)} total units
          </span>
        </div>
        {itemsSold.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--ink3)', fontSize: 13 }}>
            No sales this month yet
          </div>
        ) : (
          <div className="erp-table-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg)' }}>
                  <th style={{ textAlign: 'left', padding: '9px 16px', fontSize: 10, fontWeight: 800, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Item</th>
                  <th style={{ textAlign: 'right', padding: '9px 16px', fontSize: 10, fontWeight: 800, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Qty Sold</th>
                  <th style={{ textAlign: 'right', padding: '9px 16px', fontSize: 10, fontWeight: 800, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {itemsSold.map((item, i) => (
                  <tr
                    key={item.name + i}
                    style={{
                      borderBottom: i < itemsSold.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600 }}>{item.name}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, fontSize: 14, color: 'var(--accent)' }}>{item.qty}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 13 }}>{fmt(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--bg)' }}>
                  <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 800 }}>Total</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace", fontWeight: 900, fontSize: 14, color: 'var(--accent)' }}>{itemsSold.reduce((s, i) => s + i.qty, 0)}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace", fontWeight: 900, fontSize: 14 }}>{fmt(itemsSold.reduce((s, i) => s + i.amount, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ── RECENT BILLS ────────────────────────────────── */}
      <div
        style={{
          background: 'var(--canvas)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: 'var(--shadow)',
        }}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>
            🧾 Recent Bills
          </div>
          <span style={{ fontSize: 11, color: 'var(--ink3)' }}>
            Latest {Math.min(8, bills.length)}
          </span>
        </div>
        {recentBills.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px',
              color: 'var(--ink3)',
              fontSize: 13,
            }}
          >
            No bills yet
          </div>
        ) : (
          <div className="erp-table-scroll">
          <table
            style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}
          >
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                {['Bill No.', 'Customer', 'Date', 'Total', 'Payment'].map(h => (
                  <th
                    key={h}
                    style={{
                      padding: '9px 16px',
                      textAlign: h === 'Total' ? 'right' : 'left',
                      color: 'var(--ink3)',
                      fontWeight: 700,
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '.06em',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentBills.map((b, i) => (
                <tr
                  key={b.id}
                  style={{
                    borderBottom:
                      i < recentBills.length - 1
                        ? '1px solid var(--border)'
                        : 'none',
                  }}
                  onMouseEnter={e =>
                    (e.currentTarget.style.background = 'var(--bg)')
                  }
                  onMouseLeave={e =>
                    (e.currentTarget.style.background = 'var(--canvas)')
                  }
                >
                  <td
                    style={{
                      padding: '10px 16px',
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 11,
                      color: 'var(--accent)',
                      fontWeight: 600,
                    }}
                  >
                    {b.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td style={{ padding: '10px 16px', fontWeight: 600 }}>
                    {b.customerName || (
                      <span
                        style={{
                          color: 'var(--ink3)',
                          fontWeight: 400,
                          fontSize: 12,
                        }}
                      >
                        Walk-in
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: '10px 16px',
                      color: 'var(--ink3)',
                      fontSize: 12,
                    }}
                  >
                    {b.date}
                  </td>
                  <td
                    style={{
                      padding: '10px 16px',
                      textAlign: 'right',
                      fontFamily: "'JetBrains Mono',monospace",
                      fontWeight: 800,
                    }}
                  >
                    {fmt(b.total)}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <Badge
                      label={payLabel(b.payment)}
                      color={payColor(b.payment)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
};
