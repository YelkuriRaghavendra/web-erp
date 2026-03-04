import { useState }                     from 'react';
import { createPortal }                 from 'react-dom';
import { StatCard }                     from '../../shared/components/ui';
import { usePurchase }                  from './usePurchase';
import type { Purchase, PurchaseLine }  from '../../core/types';

// ── Purchase detail modal ─────────────────────────────────────
const PurchaseDetailModal = ({ po, onClose }: { po: Purchase; onClose: () => void }) => {
  const [search, setSearch] = useState('');
  const filtered = po.lines.filter(l =>
    l.itemName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.50)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--canvas)', borderRadius: 20, width: '100%', maxWidth: 620, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,.30)', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: 'var(--sidebar)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 6 }}>Purchase Order</div>
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", color: '#4ade80', letterSpacing: '-.01em' }}>{po.id}</div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>📅 {po.date}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>📦 {po.lines.length} item{po.lines.length !== 1 ? 's' : ''}</span>
              {po.note && <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>📝 {po.note}</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 8, color: 'rgba(255,255,255,.65)', fontSize: 18, cursor: 'pointer', padding: '4px 10px', lineHeight: 1.2, fontWeight: 400, flexShrink: 0 }}
          >&times;</button>
        </div>

        {/* Search bar */}
        <div style={{ padding: '14px 20px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="15" height="15" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="var(--ink3)" strokeWidth="2"/>
              <line x1="13.5" y1="13.5" x2="18" y2="18" stroke="var(--ink3)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search items in this purchase…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 34, paddingRight: 34, paddingTop: 9, paddingBottom: 9, borderRadius: 9, border: '1.5px solid var(--border2)', background: 'var(--canvas)', fontSize: 13, color: 'var(--ink)', outline: 'none', fontFamily: "'Plus Jakarta Sans',sans-serif" }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink3)', fontSize: 16, padding: 0, lineHeight: 1 }}>&times;</button>
            )}
          </div>
        </div>

        {/* Items table */}
        <div style={{ overflowY: 'auto', maxHeight: 380, flexShrink: 1 }}>
          {/* Sticky header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 108px 108px', position: 'sticky', top: 0, zIndex: 1, background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
            {(['Item Name', 'Qty', 'Rate', 'Total'] as const).map((h, i) => (
              <div key={h} style={{ padding: '9px 16px', fontSize: 10.5, fontWeight: 800, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.07em', textAlign: i > 0 ? 'right' : 'left' }}>{h}</div>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ink3)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⊘</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>No items match <em>"{search}"</em></div>
            </div>
          ) : (
            filtered.map((line: PurchaseLine, li) => (
              <div
                key={line.itemId}
                style={{ display: 'grid', gridTemplateColumns: '1fr 72px 108px 108px', borderBottom: li < filtered.length - 1 ? '1px solid var(--border)' : 'none', background: li % 2 === 0 ? 'var(--canvas)' : 'var(--bg)', transition: 'background .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf4'; }}
                onMouseLeave={e => { e.currentTarget.style.background = li % 2 === 0 ? 'var(--canvas)' : 'var(--bg)'; }}
              >
                <div style={{ padding: '13px 16px', fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{line.itemName}</div>
                <div style={{ padding: '13px 16px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, fontSize: 15, color: 'var(--green)' }}>{line.qty}</div>
                <div style={{ padding: '13px 16px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: 'var(--ink2)', fontWeight: 600 }}>₹{line.rate.toLocaleString()}</div>
                <div style={{ padding: '13px 16px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>₹{line.total.toLocaleString()}</div>
              </div>
            ))
          )}
        </div>

        {/* Total footer */}
        <div style={{ flexShrink: 0, borderTop: '2px solid #bbf7d0', background: '#f0fdf4', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink2)' }}>
            {po.lines.length} item{po.lines.length !== 1 ? 's' : ''} · Grand Total
          </span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 900, fontSize: 22, color: 'var(--green)' }}>
            ₹{po.grandTotal.toLocaleString()}
          </span>
        </div>

        {/* Note */}
        {po.note && (
          <div style={{ flexShrink: 0, padding: '10px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg)', fontSize: 12, color: 'var(--ink3)', fontStyle: 'italic' }}>
            📝 Note: {po.note}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Purchase history table with search + sort ─────────────────
type PSortCol = 'id' | 'date' | 'lines' | 'grandTotal';
type PSortDir = 'asc' | 'desc';

const P_COLS: { key: PSortCol | null; label: string; align: 'left' | 'right' }[] = [
  { key: 'id',         label: 'PO No.',  align: 'left'  },
  { key: 'date',       label: 'Date',    align: 'left'  },
  { key: 'lines',      label: 'Items',   align: 'right' },
  { key: 'grandTotal', label: 'Total',   align: 'right' },
  { key: null,         label: '',        align: 'left'  }, // eye column
];

const P_GRID = '140px 120px 120px 140px 48px';

const PurchasesTable = ({ purchases, stats }: {
  purchases: Purchase[];
  stats: { totalOrders: number; totalQty: number; totalSpend: number };
}) => {
  const [search,    setSearch]    = useState('');
  const [sortCol,   setSortCol]   = useState<PSortCol>('date');
  const [sortDir,   setSortDir]   = useState<PSortDir>('desc');
  const [selectedPO, setSelectedPO] = useState<Purchase | null>(null);

  const handleSort = (col: PSortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const filtered = purchases
    .filter(p => {
      const q = search.toLowerCase();
      return (
        p.id.toLowerCase().includes(q) ||
        p.date.includes(q) ||
        (p.note ?? '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let cmp = 0;
      if      (sortCol === 'id')         cmp = a.id.localeCompare(b.id);
      else if (sortCol === 'date')       cmp = a.date.localeCompare(b.date);
      else if (sortCol === 'lines')      cmp = a.lines.length - b.lines.length;
      else if (sortCol === 'grandTotal') cmp = a.grandTotal - b.grandTotal;
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const SortIcon = ({ col }: { col: PSortCol }) => (
    <span style={{ marginLeft: 4, fontSize: 9, opacity: sortCol === col ? 1 : 0.3, color: sortCol === col ? 'var(--green)' : 'inherit' }}>
      {sortCol === col ? (sortDir === 'asc' ? '▲' : '▼') : '⬍'}
    </span>
  );

  return (
    <>
      {selectedPO && createPortal(
        <PurchaseDetailModal po={selectedPO} onClose={() => setSelectedPO(null)} />,
        document.body,
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          <StatCard icon="📦" label="Total Purchases" value={stats.totalOrders}                              sub="All time"      color="orange"/>
          <StatCard icon="💸" label="Total Spend"     value={`₹${stats.totalSpend.toLocaleString()}`}        sub="All purchases" color="amber"/>
          <StatCard icon="📥" label="Items Received"  value={stats.totalQty}                                 sub="All time"      color="green"/>
        </div>

        {/* Table card */}
        <div style={{ background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow2)' }}>

          {/* Search toolbar */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
              <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="15" height="15" viewBox="0 0 20 20" fill="none">
                <circle cx="9" cy="9" r="6" stroke="var(--ink3)" strokeWidth="2"/>
                <line x1="13.5" y1="13.5" x2="18" y2="18" stroke="var(--ink3)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search by PO no, date, note…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 34, paddingRight: search ? 34 : 12, paddingTop: 8, paddingBottom: 8, borderRadius: 8, border: '1.5px solid var(--border2)', background: 'var(--canvas)', fontSize: 13, color: 'var(--ink)', outline: 'none', fontFamily: "'Plus Jakarta Sans',sans-serif" }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink3)', fontSize: 16, padding: 0, lineHeight: 1 }}>&times;</button>
              )}
            </div>
            <span style={{ fontSize: 12, color: 'var(--ink3)', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {filtered.length} of {purchases.length} order{purchases.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Table header — sortable */}
          <div style={{ display: 'grid', gridTemplateColumns: P_GRID, background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
            {P_COLS.map((col, i) => (
              <div
                key={`ph-${i}`}
                onClick={() => col.key && handleSort(col.key)}
                style={{
                  padding: '10px 14px', fontSize: 10.5, fontWeight: 800, letterSpacing: '.06em',
                  textTransform: 'uppercase', textAlign: col.align,
                  color: col.key && sortCol === col.key ? 'var(--green)' : 'var(--ink3)',
                  cursor: col.key ? 'pointer' : 'default',
                  userSelect: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start',
                  gap: 2, transition: 'color .15s',
                }}
                onMouseEnter={e => { if (col.key) e.currentTarget.style.color = 'var(--ink)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = col.key && sortCol === col.key ? 'var(--green)' : 'var(--ink3)'; }}
              >
                {col.label}
                {col.key && <SortIcon col={col.key} />}
              </div>
            ))}
          </div>

          {/* Rows */}
          {purchases.length === 0 ? (
            <div style={{ padding: '56px 24px', textAlign: 'center', color: 'var(--ink3)' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📦</div>
              <div style={{ fontWeight: 700 }}>No purchases yet — switch to New Entry to record your first purchase.</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--ink3)' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>⊘</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>No orders match <em>"{search}"</em></div>
              <button onClick={() => setSearch('')} style={{ marginTop: 12, padding: '7px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--ink3)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Clear filter</button>
            </div>
          ) : (
            filtered.map((po, idx) => (
              <div
                key={po.id}
                style={{ display: 'grid', gridTemplateColumns: P_GRID, alignItems: 'center', borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none', background: 'var(--canvas)', transition: 'background .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--canvas)'; }}
              >
                {/* PO No */}
                <div style={{ padding: '14px 14px', fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--green)', fontWeight: 700 }}>{po.id}</div>
                {/* Date */}
                <div style={{ padding: '14px 14px', fontSize: 13, color: 'var(--ink2)' }}>{po.date}</div>
                {/* Items count */}
                <div style={{ padding: '14px 14px', textAlign: 'right', fontSize: 13, color: 'var(--ink3)', fontWeight: 600 }}>
                  {po.lines.length} item{po.lines.length !== 1 ? 's' : ''}
                </div>
                {/* Grand Total */}
                <div style={{ padding: '14px 14px', textAlign: 'right' }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>₹{po.grandTotal.toLocaleString()}</span>
                </div>
                {/* 👁 Eye icon — last column */}
                <div style={{ padding: '12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <button
                    onClick={() => setSelectedPO(po)}
                    title="View purchase details"
                    style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: 7, cursor: 'pointer', padding: '4px 7px', fontSize: 14, lineHeight: 1, color: 'var(--ink3)', transition: 'all .15s', display: 'flex', alignItems: 'center' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.color = 'var(--green)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--ink3)'; }}
                  >👁</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

// ── Main purchase page ────────────────────────────────────────
export const PurchasePage = () => {
  const {
    view, setView,
    date, setDate,
    note, setNote,
    rows, setRowField,
    activeItems, stock, purchases,
    lines, grandTotal, stats,
    recordPurchase, resetForm,
  } = usePurchase();

  const inputSt: React.CSSProperties = {
    width: '100%', background: 'var(--bg)', border: '1px solid var(--border2)',
    borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--ink)', outline: 'none',
    fontFamily: "'Plus Jakarta Sans',sans-serif",
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 1300 }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-.02em' }}>Purchase</h1>
          <p  style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 3 }}>Record stock received from supplier</p>
        </div>
        <div style={{ display: 'flex', gap: 8, background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: 10, padding: 4 }}>
          {([{ id: 'entry', l: '⌨ New Entry' }, { id: 'history', l: '📦 Purchase History' }] as const).map(t => (
            <button key={t.id} onClick={() => setView(t.id as 'entry' | 'history')}
              style={{ padding: '7px 18px', borderRadius: 7, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: view === t.id ? 'var(--accent)' : 'transparent', color: view === t.id ? '#fff' : 'var(--ink3)', fontFamily: "'Plus Jakarta Sans',sans-serif", transition: 'all .15s' }}>
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {view === 'entry' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
          {/* LEFT: items received */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: 'var(--canvas)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow2)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--sidebar)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Items Received</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>Enter qty received — leave blank to skip</div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {lines.length > 0 && (
                  <span style={{ background: 'var(--green)', color: '#fff', borderRadius: 99, fontSize: 11, fontWeight: 800, padding: '3px 10px' }}>{lines.length} items</span>
                )}
                <button onClick={resetForm} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid rgba(255,255,255,.15)', background: 'transparent', color: 'rgba(255,255,255,.5)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Clear</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 110px 100px', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
              {(['Item / Stock', 'Qty', 'Rate ₹', 'Total'] as const).map((h, i) => (
                <div key={h} style={{ padding: '8px 16px', fontSize: 10.5, fontWeight: 800, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.07em', textAlign: i > 0 ? 'right' : 'left' }}>{h}</div>
              ))}
            </div>

            {activeItems.map((item, idx) => {
              const avail = stock[item.id]?.qty ?? 0;
              const qty   = +(rows[item.id]?.qty || 0);
              const rate  = +(rows[item.id]?.rate || 0);
              const tot   = qty * rate;
              const has   = qty > 0;
              return (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 110px 100px', alignItems: 'center', borderBottom: idx < activeItems.length - 1 ? '1px solid var(--border)' : 'none', background: has ? '#f0fdf4' : 'var(--canvas)' }}>
                  <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 3, height: 32, borderRadius: 99, background: has ? 'var(--green)' : 'var(--border)', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: has ? 700 : 500 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 3 }}>{avail} in stock</div>
                    </div>
                  </div>
                  <div style={{ padding: '8px 10px' }}>
                    <input type="number" min="0" placeholder="—" value={rows[item.id]?.qty || ''} onChange={e => setRowField(item.id, 'qty', e.target.value)}
                      style={{ width: '100%', textAlign: 'center', background: has ? 'var(--canvas)' : 'var(--bg)', border: `2px solid ${has ? 'var(--green)' : 'var(--border)'}`, borderRadius: 8, padding: '8px 6px', fontSize: 15, fontWeight: 800, color: has ? 'var(--green)' : 'var(--ink3)', outline: 'none', fontFamily: "'JetBrains Mono',monospace" }} />
                  </div>
                  <div style={{ padding: '8px 8px' }}>
                    <input type="number" min="0" placeholder="0" value={rows[item.id]?.rate || ''} onChange={e => setRowField(item.id, 'rate', e.target.value)}
                      style={{ width: '100%', textAlign: 'right', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: 'var(--ink2)', outline: 'none', fontFamily: "'JetBrains Mono',monospace" }} />
                  </div>
                  <div style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, fontSize: 14, color: has ? 'var(--green)' : 'var(--ink3)' }}>
                      {has ? `₹${tot.toLocaleString()}` : '—'}
                    </span>
                  </div>
                </div>
              );
            })}

            {lines.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 110px 100px', background: '#f0fdf4', borderTop: '2px solid #bbf7d0' }}>
                <div style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--green)' }}>Grand Total</div>
                <div /><div />
                <div style={{ padding: '12px 16px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace", fontWeight: 900, fontSize: 15, color: 'var(--green)' }}>₹{grandTotal.toLocaleString()}</div>
              </div>
            )}
          </div>

          {/* RIGHT: summary */}
          <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'var(--canvas)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow2)' }}>
              <div style={{ background: 'var(--sidebar)', padding: '16px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Purchase Summary</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: grandTotal > 0 ? '#4ade80' : 'rgba(255,255,255,.2)', fontFamily: "'JetBrains Mono',monospace" }}>₹{grandTotal.toLocaleString()}</div>
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>Date</div>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputSt} />
                </div>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>Note</div>
                  <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note…" style={inputSt} />
                </div>
                <button onClick={recordPurchase} disabled={!lines.length}
                  style={{
                    width: '100%', padding: 13, borderRadius: 10, border: 'none',
                    background: lines.length ? 'var(--green)' : 'var(--border)',
                    color: lines.length ? '#fff' : 'var(--ink3)', fontSize: 15, fontWeight: 800,
                    cursor: lines.length ? 'pointer' : 'not-allowed', fontFamily: "'Plus Jakarta Sans',sans-serif",
                    boxShadow: lines.length ? '0 4px 14px rgba(34,197,94,.30)' : 'none',
                  }}
                  onMouseEnter={e => { if (lines.length) e.currentTarget.style.background = '#16a34a'; }}
                  onMouseLeave={e => { if (lines.length) e.currentTarget.style.background = 'var(--green)'; }}>
                  {lines.length ? `Record Purchase · ₹${grandTotal.toLocaleString()}` : 'Enter items received'}
                </button>
              </div>
            </div>

            <div style={{ background: 'var(--canvas)', borderRadius: 12, border: '1px solid var(--border)', padding: '14px 16px', boxShadow: 'var(--shadow)' }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>All-Time Summary</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  { l: 'Total purchases',   v: stats.totalOrders,                          c: 'var(--ink)' },
                  { l: '📦 Items received', v: stats.totalQty,                             c: 'var(--green)' },
                  { l: '💸 Total spend',    v: `₹${stats.totalSpend.toLocaleString()}`,    c: 'var(--amber)' },
                ].map(r => (
                  <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--ink3)' }}>{r.l}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: r.c, fontFamily: "'JetBrains Mono',monospace" }}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <PurchasesTable purchases={purchases} stats={stats} />
      )}
    </div>
  );
};
