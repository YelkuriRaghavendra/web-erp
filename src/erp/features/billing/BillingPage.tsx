import { useState } from 'react';
import { createPortal } from 'react-dom';
import { StatCard, Badge } from '../../shared/components/ui';
import { payLabel, payColor } from '../../shared/components/ui';
import { useBilling } from './useBilling';
import type { Bill, BillLine } from '../../core/types';

// ── Bill detail modal ─────────────────────────────────────────
const BillDetailModal = ({
  bill,
  onClose,
}: {
  bill: Bill;
  onClose: () => void;
}) => {
  const [search, setSearch] = useState('');
  const filtered = bill.lines.filter(l =>
    l.itemName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.50)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--canvas)',
          borderRadius: 20,
          width: '100%',
          maxWidth: 620,
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,.30)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div
          style={{
            background: 'var(--sidebar)',
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: 'rgba(255,255,255,.4)',
                textTransform: 'uppercase',
                letterSpacing: '.12em',
                marginBottom: 6,
              }}
            >
              Bill Details
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                fontFamily: "'JetBrains Mono',monospace",
                color: '#ff9a5c',
                letterSpacing: '-.01em',
              }}
            >
              {bill.id}
            </div>
            <div
              style={{
                display: 'flex',
                gap: 16,
                marginTop: 8,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>
                📅 {bill.date}
              </span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>
                👤 {bill.customerName || 'Walk-in'}
              </span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>
                {bill.payment === 'Cash'
                  ? '💵'
                  : bill.payment === 'UPI'
                    ? '🏦'
                    : '📋'}{' '}
                {bill.payment}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,.1)',
              border: 'none',
              borderRadius: 8,
              color: 'rgba(255,255,255,.65)',
              fontSize: 18,
              cursor: 'pointer',
              padding: '4px 10px',
              lineHeight: 1.2,
              fontWeight: 400,
              flexShrink: 0,
            }}
          >
            &times;
          </button>
        </div>

        {/* Search bar */}
        <div
          style={{
            padding: '14px 20px',
            background: 'var(--bg)',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <div style={{ position: 'relative' }}>
            <svg
              style={{
                position: 'absolute',
                left: 11,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
              width='15'
              height='15'
              viewBox='0 0 20 20'
              fill='none'
            >
              <circle
                cx='9'
                cy='9'
                r='6'
                stroke='var(--ink3)'
                strokeWidth='2'
              />
              <line
                x1='13.5'
                y1='13.5'
                x2='18'
                y2='18'
                stroke='var(--ink3)'
                strokeWidth='2'
                strokeLinecap='round'
              />
            </svg>
            <input
              type='text'
              placeholder='Search items in this bill…'
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                paddingLeft: 34,
                paddingRight: 34,
                paddingTop: 9,
                paddingBottom: 9,
                borderRadius: 9,
                border: '1.5px solid var(--border2)',
                background: 'var(--canvas)',
                fontSize: 13,
                color: 'var(--ink)',
                outline: 'none',
                fontFamily: "'Plus Jakarta Sans',sans-serif",
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--ink3)',
                  fontSize: 16,
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Items table */}
        <div style={{ overflowY: 'auto', maxHeight: 380, flexShrink: 1 }}>
          {/* Table header — sticky */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 72px 108px 108px',
              position: 'sticky',
              top: 0,
              zIndex: 1,
              background: 'var(--bg)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {(['Item Name', 'Qty', 'Rate', 'Amount'] as const).map((h, i) => (
              <div
                key={h}
                style={{
                  padding: '9px 16px',
                  fontSize: 10.5,
                  fontWeight: 800,
                  color: 'var(--ink3)',
                  textTransform: 'uppercase',
                  letterSpacing: '.07em',
                  textAlign: i > 0 ? 'right' : 'left',
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--ink3)',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                No items match <em>"{search}"</em>
              </div>
            </div>
          ) : (
            filtered.map((line: BillLine, li) => (
              <div
                key={line.itemId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 72px 108px 108px',
                  borderBottom:
                    li < filtered.length - 1
                      ? '1px solid var(--border)'
                      : 'none',
                  background: li % 2 === 0 ? 'var(--canvas)' : 'var(--bg)',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--accentbg)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background =
                    li % 2 === 0 ? 'var(--canvas)' : 'var(--bg)';
                }}
              >
                <div
                  style={{
                    padding: '13px 16px',
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: 'var(--ink)',
                  }}
                >
                  {line.itemName}
                </div>
                <div
                  style={{
                    padding: '13px 16px',
                    textAlign: 'right',
                    fontFamily: "'JetBrains Mono',monospace",
                    fontWeight: 800,
                    fontSize: 15,
                    color: 'var(--accent)',
                  }}
                >
                  {line.qty}
                </div>
                <div
                  style={{
                    padding: '13px 16px',
                    textAlign: 'right',
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 13,
                    color: 'var(--ink2)',
                    fontWeight: 600,
                  }}
                >
                  ₹{line.price.toLocaleString()}
                </div>
                <div
                  style={{
                    padding: '13px 16px',
                    textAlign: 'right',
                    fontFamily: "'JetBrains Mono',monospace",
                    fontWeight: 800,
                    fontSize: 14,
                    color: 'var(--ink)',
                  }}
                >
                  ₹{line.amount.toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total footer */}
        <div
          style={{
            flexShrink: 0,
            borderTop: '2px solid var(--accentbd)',
            background: 'var(--accentbg)',
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink2)' }}>
            {bill.lines.length} item{bill.lines.length !== 1 ? 's' : ''} · Total
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontWeight: 900,
              fontSize: 22,
              color: 'var(--accent)',
            }}
          >
            ₹{bill.total.toLocaleString()}
          </span>
        </div>

        {/* Note */}
        {bill.note && (
          <div
            style={{
              flexShrink: 0,
              padding: '10px 20px',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg)',
              fontSize: 12,
              color: 'var(--ink3)',
              fontStyle: 'italic',
            }}
          >
            📝 Note: {bill.note}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Bills table with search + sort ───────────────────────────
type TodaySummary = {
  count: number;
  cash: number;
  upi: number;
  credit: number;
};
type SortCol = 'id' | 'date' | 'lines' | 'total' | 'payment';
type SortDir = 'asc' | 'desc';

const COLS: { key: SortCol | null; label: string; align: 'left' | 'right' }[] =
  [
    { key: 'id', label: 'Bill No.', align: 'left' },
    { key: 'date', label: 'Date', align: 'left' },
    { key: null, label: 'Customer', align: 'left' },
    { key: 'lines', label: 'Items', align: 'right' },
    { key: 'total', label: 'Amount', align: 'right' },
    { key: 'payment', label: 'Payment', align: 'left' },
    { key: null, label: '', align: 'left' }, // eye column
  ];

const GRID = '130px 110px 1fr 110px 120px 130px 48px';

const BillsTable = ({
  bills,
  todaySummary,
}: {
  bills: Bill[];
  todaySummary: TodaySummary;
}) => {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<SortCol>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const filtered = bills
    .filter(b => {
      const q = search.toLowerCase();
      return (
        b.id.toLowerCase().includes(q) ||
        (b.customerName ?? '').toLowerCase().includes(q) ||
        b.payment.toLowerCase().includes(q) ||
        b.date.includes(q)
      );
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortCol === 'id') cmp = a.id.localeCompare(b.id);
      else if (sortCol === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortCol === 'lines') cmp = a.lines.length - b.lines.length;
      else if (sortCol === 'total') cmp = a.total - b.total;
      else if (sortCol === 'payment') cmp = a.payment.localeCompare(b.payment);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const SortIcon = ({ col }: { col: SortCol }) => (
    <span
      style={{
        marginLeft: 4,
        fontSize: 9,
        opacity: sortCol === col ? 1 : 0.3,
        color: sortCol === col ? 'var(--accent)' : 'inherit',
      }}
    >
      {sortCol === col ? (sortDir === 'asc' ? '▲' : '▼') : '⬍'}
    </span>
  );

  return (
    <>
      {/* Bill detail modal — rendered in document.body via portal to avoid stacking context issues */}
      {selectedBill &&
        createPortal(
          <BillDetailModal
            bill={selectedBill}
            onClose={() => setSelectedBill(null)}
          />,
          document.body
        )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Stat cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 14,
          }}
        >
          <StatCard
            icon='🧾'
            label="Today's Bills"
            value={todaySummary.count}
            sub='Bills today'
            color='orange'
          />
          <StatCard
            icon='💵'
            label='Cash Today'
            value={`₹${todaySummary.cash.toLocaleString()}`}
            sub='Cash collected'
            color='green'
          />
          <StatCard
            icon='🏦'
            label='UPI Today'
            value={`₹${todaySummary.upi.toLocaleString()}`}
            sub='Bank account'
            color='blue'
          />
          <StatCard
            icon='📋'
            label='Credit Today'
            value={`₹${todaySummary.credit.toLocaleString()}`}
            sub='On credit'
            color='red'
          />
        </div>

        {/* Table card */}
        <div
          style={{
            background: 'var(--canvas)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: 'var(--shadow2)',
          }}
        >
          {/* Search toolbar */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
              <svg
                style={{
                  position: 'absolute',
                  left: 11,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
                width='15'
                height='15'
                viewBox='0 0 20 20'
                fill='none'
              >
                <circle
                  cx='9'
                  cy='9'
                  r='6'
                  stroke='var(--ink3)'
                  strokeWidth='2'
                />
                <line
                  x1='13.5'
                  y1='13.5'
                  x2='18'
                  y2='18'
                  stroke='var(--ink3)'
                  strokeWidth='2'
                  strokeLinecap='round'
                />
              </svg>
              <input
                type='text'
                placeholder='Search by bill no, customer, payment, date…'
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  paddingLeft: 34,
                  paddingRight: search ? 34 : 12,
                  paddingTop: 8,
                  paddingBottom: 8,
                  borderRadius: 8,
                  border: '1.5px solid var(--border2)',
                  background: 'var(--canvas)',
                  fontSize: 13,
                  color: 'var(--ink)',
                  outline: 'none',
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--ink3)',
                    fontSize: 16,
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  &times;
                </button>
              )}
            </div>
            <span
              style={{
                fontSize: 12,
                color: 'var(--ink3)',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {filtered.length} of {bills.length} bill
              {bills.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Table header — sortable columns */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: GRID,
              background: 'var(--bg)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {COLS.map((col, i) => (
              <div
                key={`h-${i}`}
                onClick={() => col.key && handleSort(col.key)}
                style={{
                  padding: '10px 14px',
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  textAlign: col.align,
                  color:
                    col.key && sortCol === col.key
                      ? 'var(--accent)'
                      : 'var(--ink3)',
                  cursor: col.key ? 'pointer' : 'default',
                  userSelect: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent:
                    col.align === 'right' ? 'flex-end' : 'flex-start',
                  gap: 2,
                  transition: 'color .15s',
                }}
                onMouseEnter={e => {
                  if (col.key) e.currentTarget.style.color = 'var(--ink)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color =
                    col.key && sortCol === col.key
                      ? 'var(--accent)'
                      : 'var(--ink3)';
                }}
              >
                {col.label}
                {col.key && <SortIcon col={col.key} />}
              </div>
            ))}
          </div>

          {/* Rows */}
          {bills.length === 0 ? (
            <div
              style={{
                padding: '56px 24px',
                textAlign: 'center',
                color: 'var(--ink3)',
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 10 }}>🧾</div>
              <div style={{ fontWeight: 700 }}>
                No bills yet — switch to New Entry to create your first bill.
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                color: 'var(--ink3)',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 10 }}>⊘</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                No bills match <em>"{search}"</em>
              </div>
              <button
                onClick={() => setSearch('')}
                style={{
                  marginTop: 12,
                  padding: '7px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: 'var(--ink3)',
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                }}
              >
                Clear filter
              </button>
            </div>
          ) : (
            filtered.map((bill, idx) => (
              <div
                key={bill.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: GRID,
                  alignItems: 'center',
                  borderBottom:
                    idx < filtered.length - 1
                      ? '1px solid var(--border)'
                      : 'none',
                  background: 'var(--canvas)',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--bg)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--canvas)';
                }}
              >
                {/* Bill No */}
                <div
                  style={{
                    padding: '14px 14px',
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 12,
                    color: 'var(--accent)',
                    fontWeight: 700,
                  }}
                >
                  {bill.id}
                </div>
                {/* Date */}
                <div
                  style={{
                    padding: '14px 14px',
                    fontSize: 13,
                    color: 'var(--ink2)',
                  }}
                >
                  {bill.date}
                </div>
                {/* Customer */}
                <div style={{ padding: '14px 14px' }}>
                  {bill.customerName ? (
                    <span style={{ fontWeight: 700, fontSize: 13 }}>
                      {bill.customerName}
                    </span>
                  ) : (
                    <Badge label='Walk-in' color='gray' />
                  )}
                </div>
                {/* Items count */}
                <div
                  style={{
                    padding: '14px 14px',
                    textAlign: 'right',
                    fontSize: 13,
                    color: 'var(--ink3)',
                    fontWeight: 600,
                  }}
                >
                  {bill.lines.length} item{bill.lines.length !== 1 ? 's' : ''}
                </div>
                {/* Amount */}
                <div style={{ padding: '14px 14px', textAlign: 'right' }}>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontWeight: 800,
                      fontSize: 14,
                      color: 'var(--ink)',
                    }}
                  >
                    ₹{bill.total.toLocaleString()}
                  </span>
                </div>
                {/* Payment */}
                <div style={{ padding: '14px 14px' }}>
                  <Badge
                    label={payLabel(bill.payment)}
                    color={payColor(bill.payment)}
                  />
                </div>
                {/* 👁 Eye icon — last column */}
                <div
                  style={{
                    padding: '12px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <button
                    onClick={() => setSelectedBill(bill)}
                    title='View bill details'
                    style={{
                      background: 'none',
                      border: '1.5px solid var(--border)',
                      borderRadius: 7,
                      cursor: 'pointer',
                      padding: '4px 7px',
                      fontSize: 14,
                      lineHeight: 1,
                      color: 'var(--ink3)',
                      transition: 'all .15s',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--accentbg)';
                      e.currentTarget.style.borderColor = 'var(--accent)';
                      e.currentTarget.style.color = 'var(--accent)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'none';
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.color = 'var(--ink3)';
                    }}
                  >
                    👁
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

// ── Main billing page ─────────────────────────────────────────
export const BillingPage = () => {
  const {
    view,
    setView,
    date,
    setDate,
    customerId,
    setCustomerId,
    payment,
    setPayment,
    note,
    setNote,
    qtys,
    setQtyField,
    activeItems,
    stock,
    customers,
    bills,
    lines,
    total,
    selectedCustomer,
    payOpts,
    todaySummary,
    createBill,
    resetForm,
  } = useBilling();

  const inputSt = (): React.CSSProperties => ({
    width: '100%',
    background: 'var(--bg)',
    border: '1px solid var(--border2)',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    color: 'var(--ink)',
    outline: 'none',
    fontFamily: "'Plus Jakarta Sans',sans-serif",
  });

  return (
    <div
      className='page-enter'
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        maxWidth: 1300,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: 'var(--ink)',
              letterSpacing: '-.02em',
            }}
          >
            Billing
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 3 }}>
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 8,
            background: 'var(--canvas)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: 4,
          }}
        >
          {(
            [
              { id: 'entry', l: '⌨ New Entry' },
              { id: 'history', l: '📊 Daily Sales' },
            ] as const
          ).map(t => (
            <button
              key={t.id}
              onClick={() => setView(t.id as 'entry' | 'history')}
              style={{
                padding: '7px 18px',
                borderRadius: 7,
                border: 'none',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                background: view === t.id ? 'var(--accent)' : 'transparent',
                color: view === t.id ? '#fff' : 'var(--ink3)',
                transition: 'all .15s',
                fontFamily: "'Plus Jakarta Sans',sans-serif",
              }}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {view === 'entry' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 320px',
            gap: 20,
            alignItems: 'start',
          }}
        >
          {/* LEFT: item entry */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              background: 'var(--canvas)',
              borderRadius: 16,
              border: '1px solid var(--border)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow2)',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--sidebar)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>
                  Items
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,.4)',
                    marginTop: 2,
                  }}
                >
                  Enter qty sold — leave blank to skip
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {lines.length > 0 && (
                  <span
                    style={{
                      background: 'var(--accent)',
                      color: '#fff',
                      borderRadius: 99,
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '3px 10px',
                    }}
                  >
                    {lines.length} selected
                  </span>
                )}
                <button
                  onClick={resetForm}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 7,
                    border: '1px solid rgba(255,255,255,.15)',
                    background: 'transparent',
                    color: 'rgba(255,255,255,.5)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Column headers */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 90px 110px 100px',
                background: 'var(--bg)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {(['Item / Stock', 'Qty', 'Rate ₹', 'Amount'] as const).map(
                (h, i) => (
                  <div
                    key={h}
                    style={{
                      padding: '8px 16px',
                      fontSize: 10.5,
                      fontWeight: 800,
                      color: 'var(--ink3)',
                      textTransform: 'uppercase',
                      letterSpacing: '.07em',
                      textAlign: i > 0 ? 'right' : 'left',
                    }}
                  >
                    {h}
                  </div>
                )
              )}
            </div>

            {/* Empty state when all items have zero stock */}
            {activeItems.length === 0 && (
              <div
                style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  color: 'var(--ink3)',
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 10 }}>📦</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                  No stock available
                </div>
                <div style={{ fontSize: 12 }}>
                  Add stock in Item Master before billing
                </div>
              </div>
            )}

            {/* Item rows */}
            {activeItems.map((item, idx) => {
              const avail = stock[item.id]?.qty ?? 0;
              const qty = +(qtys[item.id]?.qty || 0);
              const rate = +(qtys[item.id]?.rate ?? item.price);
              const amt = qty * rate;
              const has = qty > 0;
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 90px 110px 100px',
                    alignItems: 'center',
                    borderBottom:
                      idx < activeItems.length - 1
                        ? '1px solid var(--border)'
                        : 'none',
                    background: has ? '#fffbf7' : 'var(--canvas)',
                    transition: 'background .2s',
                  }}
                >
                  <div
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 3,
                        height: 32,
                        borderRadius: 99,
                        background: has ? 'var(--accent)' : 'var(--border)',
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: 13.5,
                          fontWeight: has ? 700 : 500,
                          color: has ? 'var(--ink)' : 'var(--ink2)',
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          marginTop: 3,
                          fontWeight: 600,
                          color: 'var(--green)',
                        }}
                      >
                        {avail} in stock
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '8px 10px' }}>
                    <input
                      type='number'
                      min='0'
                      placeholder='—'
                      value={qtys[item.id]?.qty || ''}
                      onChange={e =>
                        setQtyField(item.id, 'qty', e.target.value)
                      }
                      style={{
                        width: '100%',
                        textAlign: 'center',
                        background: has ? 'var(--canvas)' : 'var(--bg)',
                        border: `2px solid ${has ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 8,
                        padding: '8px 6px',
                        fontSize: 15,
                        fontWeight: 800,
                        color: has ? 'var(--accent)' : 'var(--ink3)',
                        outline: 'none',
                        fontFamily: "'JetBrains Mono',monospace",
                      }}
                    />
                  </div>
                  <div style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--ink2)',
                      }}
                    >
                      ₹{rate.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontWeight: 800,
                        fontSize: 14,
                        color: has ? 'var(--ink)' : 'var(--ink3)',
                      }}
                    >
                      {has ? `₹${amt.toLocaleString()}` : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT: Receipt */}
          <div
            style={{
              position: 'sticky',
              top: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div
              style={{
                background: 'var(--canvas)',
                borderRadius: 16,
                border: '1px solid var(--border)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow2)',
              }}
            >
              {/* Receipt header */}
              <div
                style={{ background: 'var(--sidebar)', padding: '16px 20px' }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: 'rgba(255,255,255,.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '.1em',
                    marginBottom: 4,
                  }}
                >
                  Live Bill
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <span
                    style={{
                      fontSize: 28,
                      fontWeight: 900,
                      color: total > 0 ? '#ff9a5c' : 'rgba(255,255,255,.2)',
                      fontFamily: "'JetBrains Mono',monospace",
                    }}
                  >
                    ₹{total.toLocaleString()}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,.3)' }}>
                    {lines.length} item{lines.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Line items */}
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {lines.length === 0 ? (
                  <div
                    style={{
                      padding: '24px 20px',
                      textAlign: 'center',
                      color: 'var(--ink3)',
                      fontSize: 13,
                    }}
                  >
                    Enter quantities to start
                  </div>
                ) : (
                  lines.map(l => (
                    <div
                      key={l.itemId}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 16px',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>
                          {l.itemName}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--ink3)',
                            marginTop: 1,
                          }}
                        >
                          {l.qty} × ₹{l.price.toLocaleString()}
                        </div>
                      </div>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          fontWeight: 700,
                          fontSize: 13,
                          color: 'var(--accent)',
                        }}
                      >
                        ₹{l.amount.toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Controls */}
              <div
                style={{
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  borderTop: '1px solid var(--border)',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      color: 'var(--ink3)',
                      textTransform: 'uppercase',
                      letterSpacing: '.07em',
                      marginBottom: 5,
                    }}
                  >
                    Date
                  </div>
                  <input
                    type='date'
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    style={inputSt()}
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      color: 'var(--ink3)',
                      textTransform: 'uppercase',
                      letterSpacing: '.07em',
                      marginBottom: 5,
                    }}
                  >
                    Customer{' '}
                    <span
                      style={{
                        fontWeight: 400,
                        textTransform: 'none',
                        letterSpacing: 0,
                      }}
                    >
                      (optional)
                    </span>
                  </div>
                  <select
                    value={customerId}
                    onChange={e => setCustomerId(e.target.value)}
                    style={inputSt()}
                  >
                    <option value=''>— Walk-in —</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.credit ? ' (Credit)' : ''}
                      </option>
                    ))}
                  </select>
                  {selectedCustomer?.credit && (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--red)',
                      }}
                    >
                      📋 Outstanding: ₹
                      {selectedCustomer.outstanding.toLocaleString()}
                    </div>
                  )}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      color: 'var(--ink3)',
                      textTransform: 'uppercase',
                      letterSpacing: '.07em',
                      marginBottom: 7,
                    }}
                  >
                    Payment
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {payOpts.map(o => (
                      <button
                        key={o.v}
                        onClick={() =>
                          setPayment(o.v as 'Cash' | 'UPI' | 'Credit')
                        }
                        style={{
                          flex: 1,
                          padding: '8px 4px',
                          borderRadius: 8,
                          border: `2px solid ${payment === o.v ? (o.v === 'Cash' ? 'var(--green)' : o.v === 'UPI' ? 'var(--blue)' : 'var(--red)') : 'var(--border)'}`,
                          background:
                            payment === o.v
                              ? o.v === 'Cash'
                                ? 'var(--greenbg)'
                                : o.v === 'UPI'
                                  ? 'var(--bluebg)'
                                  : 'var(--redbg)'
                              : 'var(--bg)',
                          cursor: 'pointer',
                          fontSize: 11,
                          fontWeight: 700,
                          color:
                            payment === o.v
                              ? o.v === 'Cash'
                                ? 'var(--green)'
                                : o.v === 'UPI'
                                  ? 'var(--blue)'
                                  : 'var(--red)'
                              : 'var(--ink3)',
                          fontFamily: "'Plus Jakarta Sans',sans-serif",
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: 16, marginBottom: 2 }}>
                          {o.icon}
                        </div>
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      color: 'var(--ink3)',
                      textTransform: 'uppercase',
                      letterSpacing: '.07em',
                      marginBottom: 5,
                    }}
                  >
                    Note
                  </div>
                  <input
                    type='text'
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder='Optional remark…'
                    style={inputSt()}
                  />
                </div>
                <button
                  onClick={createBill}
                  disabled={!lines.length}
                  style={{
                    width: '100%',
                    padding: 13,
                    borderRadius: 10,
                    border: 'none',
                    background: lines.length
                      ? 'var(--accent)'
                      : 'var(--border)',
                    color: lines.length ? '#fff' : 'var(--ink3)',
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: lines.length ? 'pointer' : 'not-allowed',
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                    boxShadow: lines.length
                      ? '0 4px 14px rgba(232,98,10,.35)'
                      : 'none',
                  }}
                  onMouseEnter={e => {
                    if (lines.length)
                      e.currentTarget.style.background = '#c9540a';
                  }}
                  onMouseLeave={e => {
                    if (lines.length)
                      e.currentTarget.style.background = 'var(--accent)';
                  }}
                >
                  {lines.length
                    ? `Create Bill · ₹${total.toLocaleString()}`
                    : 'Enter items to bill'}
                </button>
              </div>
            </div>

            {/* Today summary */}
            <div
              style={{
                background: 'var(--canvas)',
                borderRadius: 12,
                border: '1px solid var(--border)',
                padding: '14px 16px',
                boxShadow: 'var(--shadow)',
              }}
            >
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  color: 'var(--ink3)',
                  textTransform: 'uppercase',
                  letterSpacing: '.07em',
                  marginBottom: 10,
                }}
              >
                Today's Summary
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  { l: 'Bills raised', v: todaySummary.count, c: 'var(--ink)' },
                  {
                    l: '💵 Cash',
                    v: `₹${todaySummary.cash.toLocaleString()}`,
                    c: 'var(--green)',
                  },
                  {
                    l: '🏦 UPI',
                    v: `₹${todaySummary.upi.toLocaleString()}`,
                    c: 'var(--blue)',
                  },
                  {
                    l: '📋 Credit',
                    v: `₹${todaySummary.credit.toLocaleString()}`,
                    c: 'var(--red)',
                  },
                ].map(r => (
                  <div
                    key={r.l}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: 'var(--ink3)',
                        fontWeight: 500,
                      }}
                    >
                      {r.l}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: r.c,
                        fontFamily: "'JetBrains Mono',monospace",
                      }}
                    >
                      {r.v}
                    </span>
                  </div>
                ))}
                <div
                  style={{
                    height: 1,
                    background: 'var(--border)',
                    margin: '2px 0',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--ink2)',
                    }}
                  >
                    Total billed
                  </span>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 900,
                      color: 'var(--accent)',
                      fontFamily: "'JetBrains Mono',monospace",
                    }}
                  >
                    ₹
                    {(
                      todaySummary.cash +
                      todaySummary.upi +
                      todaySummary.credit
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <BillsTable bills={bills} todaySummary={todaySummary} />
      )}
    </div>
  );
};
