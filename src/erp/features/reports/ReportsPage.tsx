import { useState } from 'react';
import {
  Page,
  Btn,
  Badge,
  Modal,
  Field,
  Row,
} from '../../shared/components/ui';
import { monthLabel } from '../../core/constants';
import { useReports, TABS } from './useReports';
import type { ERPUser } from '../../core/types';

// ── Monospace number cell ─────────────────────────────────────
const Num = ({ v, color }: { v: number; color?: string }) => (
  <span
    style={{
      fontFamily: "'JetBrains Mono',monospace",
      fontWeight: 700,
      color: color ?? 'var(--ink)',
    }}
  >
    {v !== 0 ? (
      `₹${v.toLocaleString()}`
    ) : (
      <span style={{ color: 'var(--ink3)', fontWeight: 400 }}>—</span>
    )}
  </span>
);

export const ReportsPage = () => {
  const {
    months,
    purchases,
    monthlyData,
    dailyData,
    creditCustomers,
    inventoryValue,
    tab,
    setTab,
    editOB,
    setEditOB,
    openOBModal,
    saveOB,
    depositStats,
    depositsByItem,
    depositSettlements,
    settleDeposits,
  } = useReports();

  // ── Settle form state ──────────────────────────────────
  const [settleAmt, setSettleAmt] = useState('');
  const [settleDate, setSettleDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [settleNote, setSettleNote] = useState('');

  const user: ERPUser | null = (() => {
    try { return JSON.parse(sessionStorage.getItem('gas-erp-user') ?? 'null'); } catch { return null; }
  })();
  const isAdmin = user?.role === 'Admin';

  return (
    <Page
      title='Reports'
      subtitle='Business P&L, sales analysis and purchase history'
    >
      {/* ── Tab bar ─────────────────────────────────────── */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div
        style={{
          display: 'flex',
          gap: 2,
          background: 'var(--canvas)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: 4,
          width: 'fit-content',
          boxShadow: 'var(--shadow)',
        }}
      >
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '7px 18px',
              borderRadius: 7,
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: tab === t.id ? 'var(--accent)' : 'transparent',
              color: tab === t.id ? '#fff' : 'var(--ink3)',
              fontFamily: "'Plus Jakarta Sans',sans-serif",
              transition: 'background .15s',
            }}
          >
            {t.l}
          </button>
        ))}
      </div>
      </div>

      {/* ─── P&L OVERVIEW ──────────────────────────────── */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {months.length === 0 ? (
            <div
              style={{
                background: 'var(--canvas)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 60,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
              <div style={{ fontWeight: 700, color: 'var(--ink3)' }}>
                No data yet — create bills to see the P&L report.
              </div>
            </div>
          ) : (
            <>
              {/* ── All-time summary cards ─── */}
              <div className="erp-grid-4">
                {[
                  {
                    l: 'All-time Revenue',
                    v: monthlyData.reduce((s, d) => s + d.total, 0),
                    c: 'var(--green)',
                  },
                  {
                    l: 'Total Purchases',
                    v: monthlyData.reduce((s, d) => s + d.purchaseCost, 0),
                    c: 'var(--amber,#d97706)',
                  },
                  {
                    l: 'Total Expenses',
                    v: monthlyData.reduce((s, d) => s + d.totalExpenses, 0),
                    c: 'var(--red)',
                  },
                  {
                    l: 'Net Profit',
                    v: monthlyData.reduce((s, d) => s + d.netProfit, 0),
                    c:
                      monthlyData.reduce((s, d) => s + d.netProfit, 0) >= 0
                        ? 'var(--green)'
                        : 'var(--red)',
                  },
                ].map(r => (
                  <div
                    key={r.l}
                    style={{
                      background: 'var(--canvas)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      padding: '16px 20px',
                      boxShadow: 'var(--shadow)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--ink3)',
                        textTransform: 'uppercase',
                        letterSpacing: '.07em',
                        marginBottom: 6,
                      }}
                    >
                      {r.l}
                    </div>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 900,
                        color: r.c,
                        fontFamily: "'JetBrains Mono',monospace",
                      }}
                    >
                      ₹{r.v.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Monthly P&L table ─── */}
              <div
                style={{
                  background: 'var(--canvas)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  overflow: 'clip',
                  boxShadow: 'var(--shadow2)',
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
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: 'var(--ink)',
                    }}
                  >
                    Monthly Breakdown
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink3)' }}>
                    Net Profit = Revenue - Purchases - Expenses
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: 13,
                    }}
                  >
                    <thead>
                      <tr style={{ background: 'var(--bg)' }}>
                        {[
                          { h: 'Month', align: 'left' },
                          { h: 'Bills', align: 'left' },
                          { h: 'Revenue', align: 'right' },
                          { h: 'Purchases', align: 'right' },
                          { h: 'Expenses', align: 'right' },
                          { h: 'Gross Profit', align: 'right' },
                          { h: 'Net Profit', align: 'right' },
                          { h: 'Cash OB', align: 'right' },
                          { h: 'Cash CB', align: 'right' },
                          { h: 'Bank OB', align: 'right' },
                          { h: 'Bank CB', align: 'right' },
                          { h: '', align: 'left' },
                        ].map(({ h, align }) => (
                          <th
                            key={h}
                            style={{
                              padding: '10px 14px',
                              textAlign: align as 'left' | 'right',
                              color: 'var(--ink3)',
                              fontWeight: 700,
                              fontSize: 11,
                              textTransform: 'uppercase',
                              letterSpacing: '.06em',
                              borderBottom: '1px solid var(--border)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map((d, i) => (
                        <tr
                          key={d.m}
                          style={{
                            borderBottom:
                              i < monthlyData.length - 1
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
                              padding: '11px 14px',
                              fontWeight: 700,
                              color: 'var(--ink)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {d.label}
                          </td>
                          <td
                            style={{
                              padding: '11px 14px',
                              color: 'var(--ink3)',
                              fontSize: 12,
                            }}
                          >
                            {d.billCount}
                          </td>
                          <td
                            style={{ padding: '11px 14px', textAlign: 'right' }}
                          >
                            <Num v={d.total} color='var(--green)' />
                          </td>
                          <td
                            style={{ padding: '11px 14px', textAlign: 'right' }}
                          >
                            <Num v={d.purchaseCost} color='var(--amber,#d97706)' />
                          </td>
                          <td
                            style={{ padding: '11px 14px', textAlign: 'right' }}
                          >
                            <Num v={d.totalExpenses} color={d.totalExpenses > 0 ? 'var(--red)' : undefined} />
                          </td>
                          <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, color: d.grossProfit >= 0 ? 'var(--blue)' : 'var(--red)' }}>
                              {d.grossProfit < 0 ? '−' : ''}₹{Math.abs(d.grossProfit).toLocaleString()}
                            </span>
                          </td>
                          <td
                            style={{ padding: '11px 14px', textAlign: 'right' }}
                          >
                            <span
                              style={{
                                fontFamily: "'JetBrains Mono',monospace",
                                fontWeight: 800,
                                color: d.netProfit >= 0 ? 'var(--green)' : 'var(--red)',
                              }}
                            >
                              {d.netProfit < 0 ? '−' : ''}₹{Math.abs(d.netProfit).toLocaleString()}
                            </span>
                          </td>
                          <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                            <Num v={d.cashOB} color='var(--ink3)' />
                          </td>
                          <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                            <Num v={d.cashCB} color={d.cashCB >= 0 ? 'var(--green)' : 'var(--red)'} />
                          </td>
                          <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                            <Num v={d.bankOB} color='var(--ink3)' />
                          </td>
                          <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                            <Num v={d.bankCB} color={d.bankCB >= 0 ? 'var(--blue)' : 'var(--red)'} />
                          </td>
                          <td style={{ padding: '11px 14px' }}>
                            <button
                              onClick={() => openOBModal(d.m)}
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: 'var(--ink3)',
                                background: 'none',
                                border: '1px solid var(--border)',
                                borderRadius: 6,
                                padding: '3px 8px',
                                cursor: 'pointer',
                                fontFamily: "'Plus Jakarta Sans',sans-serif",
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Set OB
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {/* Totals row */}
                    <tfoot>
                      <tr
                        style={{
                          background: 'var(--bg)',
                          borderTop: '2px solid var(--border)',
                        }}
                      >
                        <td style={{ padding: '11px 14px', fontWeight: 800, color: 'var(--ink)' }}>
                          Total
                        </td>
                        <td style={{ padding: '11px 14px', color: 'var(--ink3)', fontSize: 12 }}>
                          {monthlyData.reduce((s, d) => s + d.billCount, 0)}
                        </td>
                        <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                          <Num v={monthlyData.reduce((s, d) => s + d.total, 0)} color='var(--green)' />
                        </td>
                        <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                          <Num v={monthlyData.reduce((s, d) => s + d.purchaseCost, 0)} color='var(--amber,#d97706)' />
                        </td>
                        <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                          <Num v={monthlyData.reduce((s, d) => s + d.totalExpenses, 0)} color='var(--red)' />
                        </td>
                        <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                          {(() => {
                            const g = monthlyData.reduce((s, d) => s + d.grossProfit, 0);
                            return (
                              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 900, fontSize: 14, color: g >= 0 ? 'var(--blue)' : 'var(--red)' }}>
                                {g < 0 ? '−' : ''}₹{Math.abs(g).toLocaleString()}
                              </span>
                            );
                          })()}
                        </td>
                        <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                          {(() => {
                            const t = monthlyData.reduce((s, d) => s + d.netProfit, 0);
                            return (
                              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 900, fontSize: 14, color: t >= 0 ? 'var(--green)' : 'var(--red)' }}>
                                {t < 0 ? '−' : ''}₹{Math.abs(t).toLocaleString()}
                              </span>
                            );
                          })()}
                        </td>
                        <td colSpan={5} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── SALES REPORT ──────────────────────────────── */}
      {tab === 'daily' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Summary cards */}
          <div className="erp-grid-3">
            {[
              {
                l: 'Total Bills',
                v: `${monthlyData.reduce((s, d) => s + d.billCount, 0)}`,
                c: 'var(--accent)',
              },
              {
                l: 'Cash Revenue',
                v: `₹${monthlyData.reduce((s, d) => s + d.cashSales, 0).toLocaleString()}`,
                c: 'var(--green)',
              },
              {
                l: 'UPI Revenue',
                v: `₹${monthlyData.reduce((s, d) => s + d.upiSales, 0).toLocaleString()}`,
                c: 'var(--blue)',
              },
            ].map(r => (
              <div
                key={r.l}
                style={{
                  background: 'var(--canvas)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '16px 20px',
                  boxShadow: 'var(--shadow)',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--ink3)',
                    textTransform: 'uppercase',
                    letterSpacing: '.07em',
                    marginBottom: 6,
                  }}
                >
                  {r.l}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: r.c,
                    fontFamily: "'JetBrains Mono',monospace",
                  }}
                >
                  {r.v}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              background: 'var(--canvas)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              overflow: 'clip',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                fontSize: 13,
                fontWeight: 800,
                color: 'var(--ink)',
              }}
            >
              Date-wise Sales
            </div>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table
              style={{
                width: '100%',
                minWidth: 440,
                borderCollapse: 'collapse',
                fontSize: 13.5,
              }}
            >
              <thead>
                <tr style={{ background: 'var(--bg)' }}>
                  {['Date', 'Bills', 'Cash', 'UPI', 'Credit', 'Total'].map(
                    h => (
                      <th
                        key={h}
                        style={{
                          padding: '10px 16px',
                          textAlign:
                            h === 'Date' || h === 'Bills' ? 'left' : 'right',
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
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {dailyData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: '48px 20px',
                        textAlign: 'center',
                        color: 'var(--ink3)',
                      }}
                    >
                      No sales yet
                    </td>
                  </tr>
                ) : (
                  dailyData.map(r => (
                    <tr
                      key={r.date}
                      style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e =>
                        (e.currentTarget.style.background = 'var(--bg)')
                      }
                      onMouseLeave={e =>
                        (e.currentTarget.style.background = 'var(--canvas)')
                      }
                    >
                      <td style={{ padding: '11px 16px', fontWeight: 600 }}>
                        {r.date}
                      </td>
                      <td
                        style={{ padding: '11px 16px', color: 'var(--ink3)' }}
                      >
                        {r.count}
                      </td>
                      <td
                        style={{
                          padding: '11px 16px',
                          textAlign: 'right',
                          fontFamily: "'JetBrains Mono',monospace",
                          color: 'var(--green)',
                          fontWeight: 700,
                        }}
                      >
                        {r.cash > 0 ? `₹${r.cash.toLocaleString()}` : '—'}
                      </td>
                      <td
                        style={{
                          padding: '11px 16px',
                          textAlign: 'right',
                          fontFamily: "'JetBrains Mono',monospace",
                          color: 'var(--blue)',
                          fontWeight: 700,
                        }}
                      >
                        {r.upi > 0 ? `₹${r.upi.toLocaleString()}` : '—'}
                      </td>
                      <td
                        style={{
                          padding: '11px 16px',
                          textAlign: 'right',
                          fontFamily: "'JetBrains Mono',monospace",
                          color: 'var(--red)',
                          fontWeight: 700,
                        }}
                      >
                        {r.credit > 0 ? `₹${r.credit.toLocaleString()}` : '—'}
                      </td>
                      <td
                        style={{
                          padding: '11px 16px',
                          textAlign: 'right',
                          fontFamily: "'JetBrains Mono',monospace",
                          fontWeight: 800,
                        }}
                      >
                        ₹{r.total.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── CREDIT REPORT ─────────────────────────────── */}
      {tab === 'credit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="erp-grid-3">
            {[
              {
                l: 'Credit Accounts',
                v: creditCustomers.length,
                c: 'var(--accent)',
              },
              {
                l: 'Total Outstanding',
                v: `₹${creditCustomers.reduce((s, c) => s + c.outstanding, 0).toLocaleString()}`,
                c: 'var(--red)',
              },
              {
                l: 'Cleared Accounts',
                v: creditCustomers.filter(c => c.outstanding === 0).length,
                c: 'var(--green)',
              },
            ].map(r => (
              <div
                key={r.l}
                style={{
                  background: 'var(--canvas)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '16px 20px',
                  boxShadow: 'var(--shadow)',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--ink3)',
                    textTransform: 'uppercase',
                    letterSpacing: '.07em',
                    marginBottom: 6,
                  }}
                >
                  {r.l}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: r.c,
                    fontFamily: "'JetBrains Mono',monospace",
                  }}
                >
                  {r.v}
                </div>
              </div>
            ))}
          </div>

          {creditCustomers.length === 0 ? (
            <div
              style={{
                background: 'var(--canvas)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '60px 40px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
              <div style={{ fontWeight: 700, color: 'var(--ink3)' }}>
                No credit accounts yet.
              </div>
            </div>
          ) : (
            <div
              style={{
                background: 'var(--canvas)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                overflow: 'clip',
                boxShadow: 'var(--shadow)',
              }}
            >
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table
                style={{
                  width: '100%',
                  minWidth: 480,
                  borderCollapse: 'collapse',
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr style={{ background: 'var(--bg)' }}>
                    {[
                      'Customer',
                      'Phone',
                      'Since',
                      'Outstanding',
                      'Status',
                    ].map(h => (
                      <th
                        key={h}
                        style={{
                          padding: '10px 16px',
                          textAlign: h === 'Outstanding' ? 'right' : 'left',
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
                  {creditCustomers.map((c, i) => (
                    <tr
                      key={c.id}
                      style={{
                        borderBottom:
                          i < creditCustomers.length - 1
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
                          padding: '12px 16px',
                          fontWeight: 700,
                          color: 'var(--ink)',
                        }}
                      >
                        {c.name}
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          color: 'var(--ink3)',
                          fontSize: 12,
                        }}
                      >
                        {c.phone || '—'}
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          color: 'var(--ink3)',
                          fontSize: 12,
                        }}
                      >
                        {c.joinDate}
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          textAlign: 'right',
                          fontFamily: "'JetBrains Mono',monospace",
                          fontWeight: 800,
                          color:
                            c.outstanding > 0 ? 'var(--red)' : 'var(--green)',
                        }}
                      >
                        ₹{c.outstanding.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge
                          label={c.outstanding > 0 ? 'Due' : 'Clear'}
                          color={c.outstanding > 0 ? 'red' : 'green'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── PURCHASES ─────────────────────────────────── */}
      {tab === 'purchase' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="erp-grid-3">
            {[
              { l: 'Total Orders', v: purchases.length, c: 'var(--green)' },
              {
                l: 'Total Spend',
                v: `₹${purchases.reduce((s, p) => s + p.grandTotal, 0).toLocaleString()}`,
                c: 'var(--amber,#d97706)',
              },
              {
                l: 'Inventory Value',
                v: `₹${inventoryValue.toLocaleString()}`,
                c: 'var(--purple,#7c3aed)',
              },
            ].map(r => (
              <div
                key={r.l}
                style={{
                  background: 'var(--canvas)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '16px 20px',
                  boxShadow: 'var(--shadow)',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--ink3)',
                    textTransform: 'uppercase',
                    letterSpacing: '.07em',
                    marginBottom: 6,
                  }}
                >
                  {r.l}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: r.c,
                    fontFamily: "'JetBrains Mono',monospace",
                  }}
                >
                  {r.v}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              background: 'var(--canvas)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              overflow: 'clip',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                fontSize: 13,
                fontWeight: 800,
                color: 'var(--ink)',
              }}
            >
              Purchase Orders
            </div>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table
              style={{
                width: '100%',
                minWidth: 420,
                borderCollapse: 'collapse',
                fontSize: 13.5,
              }}
            >
              <thead>
                <tr style={{ background: 'var(--bg)' }}>
                  {['PO No.', 'Date', 'Items', 'Total', 'Note'].map(h => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 16px',
                        color: 'var(--ink3)',
                        fontWeight: 700,
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: '.06em',
                        borderBottom: '1px solid var(--border)',
                        textAlign: 'left',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: '48px',
                        textAlign: 'center',
                        color: 'var(--ink3)',
                      }}
                    >
                      No purchases yet
                    </td>
                  </tr>
                ) : (
                  [...purchases]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((p, i, arr) => (
                      <tr
                        key={p.id}
                        style={{
                          borderBottom:
                            i < arr.length - 1
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
                            padding: '11px 16px',
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 12,
                            color: 'var(--green)',
                            fontWeight: 600,
                          }}
                        >
                          {p.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td
                          style={{ padding: '11px 16px', color: 'var(--ink3)' }}
                        >
                          {p.date}
                        </td>
                        <td style={{ padding: '11px 16px' }}>
                          {p.lines.length} item{p.lines.length !== 1 ? 's' : ''}
                        </td>
                        <td
                          style={{
                            padding: '11px 16px',
                            fontFamily: "'JetBrains Mono',monospace",
                            fontWeight: 800,
                          }}
                        >
                          ₹{p.grandTotal.toLocaleString()}
                        </td>
                        <td
                          style={{
                            padding: '11px 16px',
                            color: 'var(--ink3)',
                            fontSize: 12,
                          }}
                        >
                          {p.note || '—'}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── DEPOSITS ─────────────────────────────────── */}
      {tab === 'deposits' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Summary cards */}
          <div className="erp-grid-3">
            {[
              {
                l: 'Total Collected',
                v: `\u20B9${depositStats.totalCollected.toLocaleString()}`,
                c: 'var(--accent)',
              },
              {
                l: 'Total Settled',
                v: `\u20B9${depositStats.totalSettled.toLocaleString()}`,
                c: 'var(--green)',
              },
              {
                l: 'Unsettled Balance',
                v: `\u20B9${depositStats.unsettled.toLocaleString()}`,
                c: depositStats.unsettled > 0 ? 'var(--red)' : 'var(--green)',
              },
            ].map(r => (
              <div
                key={r.l}
                style={{
                  background: 'var(--canvas)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '16px 20px',
                  boxShadow: 'var(--shadow)',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--ink3)',
                    textTransform: 'uppercase',
                    letterSpacing: '.07em',
                    marginBottom: 6,
                  }}
                >
                  {r.l}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: r.c,
                    fontFamily: "'JetBrains Mono',monospace",
                  }}
                >
                  {r.v}
                </div>
              </div>
            ))}
          </div>

          {/* Deposits by Item */}
          <div
            style={{
              background: 'var(--canvas)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              overflow: 'clip',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                fontSize: 13,
                fontWeight: 800,
                color: 'var(--ink)',
              }}
            >
              Deposits by Item
            </div>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table
                style={{
                  width: '100%',
                  minWidth: 440,
                  borderCollapse: 'collapse',
                  fontSize: 13.5,
                }}
              >
                <thead>
                  <tr style={{ background: 'var(--bg)' }}>
                    {['Item', 'Qty Sold', 'Deposit/Unit', 'Total Deposit'].map(h => (
                      <th
                        key={h}
                        style={{
                          padding: '10px 16px',
                          textAlign: h === 'Item' ? 'left' : 'right',
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
                  {depositsByItem.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          padding: '48px 20px',
                          textAlign: 'center',
                          color: 'var(--ink3)',
                        }}
                      >
                        No deposit items billed yet
                      </td>
                    </tr>
                  ) : (
                    depositsByItem.map((d, i) => (
                      <tr
                        key={`${d.name}-${d.depositPerUnit}`}
                        style={{
                          borderBottom:
                            i < depositsByItem.length - 1
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
                        <td style={{ padding: '11px 16px', fontWeight: 700, color: 'var(--ink)' }}>
                          {d.name}
                        </td>
                        <td
                          style={{
                            padding: '11px 16px',
                            textAlign: 'right',
                            color: 'var(--ink3)',
                          }}
                        >
                          {d.qty}
                        </td>
                        <td
                          style={{
                            padding: '11px 16px',
                            textAlign: 'right',
                            fontFamily: "'JetBrains Mono',monospace",
                            fontWeight: 700,
                          }}
                        >
                          {'\u20B9'}{d.depositPerUnit.toLocaleString()}
                        </td>
                        <td
                          style={{
                            padding: '11px 16px',
                            textAlign: 'right',
                            fontFamily: "'JetBrains Mono',monospace",
                            fontWeight: 800,
                            color: 'var(--accent)',
                          }}
                        >
                          {'\u20B9'}{d.totalDeposit.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Settle Deposits — Admin only */}
          {isAdmin && (
            <div
              style={{
                background: 'var(--canvas)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '16px 20px',
                boxShadow: 'var(--shadow)',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: 'var(--ink)',
                  marginBottom: 12,
                }}
              >
                Settle Deposits
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: '1 1 120px', minWidth: 120 }}>
                  <Field
                    label='Amount (\u20B9)'
                    type='number'
                    value={settleAmt}
                    onChange={setSettleAmt}
                  />
                </div>
                <div style={{ flex: '1 1 140px', minWidth: 140 }}>
                  <Field
                    label='Date'
                    type='date'
                    value={settleDate}
                    onChange={setSettleDate}
                  />
                </div>
                <div style={{ flex: '2 1 180px', minWidth: 180 }}>
                  <Field
                    label='Note'
                    value={settleNote}
                    onChange={setSettleNote}
                  />
                </div>
                <Btn
                  onClick={() => {
                    settleDeposits(Number(settleAmt), settleDate, settleNote);
                    setSettleAmt('');
                    setSettleNote('');
                  }}
                >
                  Settle from Bank
                </Btn>
              </div>
            </div>
          )}

          {/* Settlement History */}
          <div
            style={{
              background: 'var(--canvas)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              overflow: 'clip',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                fontSize: 13,
                fontWeight: 800,
                color: 'var(--ink)',
              }}
            >
              Settlement History
            </div>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table
                style={{
                  width: '100%',
                  minWidth: 440,
                  borderCollapse: 'collapse',
                  fontSize: 13.5,
                }}
              >
                <thead>
                  <tr style={{ background: 'var(--bg)' }}>
                    {['Date', 'Amount', 'Note', 'Settled By'].map(h => (
                      <th
                        key={h}
                        style={{
                          padding: '10px 16px',
                          textAlign: h === 'Amount' ? 'right' : 'left',
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
                  {depositSettlements.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          padding: '48px 20px',
                          textAlign: 'center',
                          color: 'var(--ink3)',
                        }}
                      >
                        No settlements yet
                      </td>
                    </tr>
                  ) : (
                    depositSettlements.map((s, i) => (
                      <tr
                        key={s.id}
                        style={{
                          borderBottom:
                            i < depositSettlements.length - 1
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
                        <td style={{ padding: '11px 16px', fontWeight: 600 }}>
                          {s.date}
                        </td>
                        <td
                          style={{
                            padding: '11px 16px',
                            textAlign: 'right',
                            fontFamily: "'JetBrains Mono',monospace",
                            fontWeight: 800,
                            color: 'var(--green)',
                          }}
                        >
                          {'\u20B9'}{s.amount.toLocaleString()}
                        </td>
                        <td
                          style={{
                            padding: '11px 16px',
                            color: 'var(--ink3)',
                            fontSize: 12,
                          }}
                        >
                          {s.note || '\u2014'}
                        </td>
                        <td
                          style={{
                            padding: '11px 16px',
                            color: 'var(--ink3)',
                            fontSize: 12,
                          }}
                        >
                          {s.createdBy || '\u2014'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Opening Balance Modal */}
      {editOB && (
        <Modal
          title={`Set Opening Balance — ${monthLabel(editOB.month)}`}
          onClose={() => setEditOB(null)}
          width={380}
        >
          <div
            style={{
              fontSize: 13,
              color: 'var(--ink3)',
              padding: '10px 14px',
              background: 'var(--bg)',
              borderRadius: 8,
              border: '1px solid var(--border)',
            }}
          >
            The opening balance is the cash and bank amount at the start of{' '}
            {monthLabel(editOB.month)}.
          </div>
          <Row>
            <Field
              label='Cash Opening (₹)'
              type='number'
              value={String(editOB.cashOB)}
              onChange={v => setEditOB(p => (p ? { ...p, cashOB: +v } : p))}
            />
            <Field
              label='Bank Opening (₹)'
              type='number'
              value={String(editOB.bankOB)}
              onChange={v => setEditOB(p => (p ? { ...p, bankOB: +v } : p))}
            />
          </Row>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant='ghost' onClick={() => setEditOB(null)}>
              Cancel
            </Btn>
            <Btn onClick={saveOB}>Save</Btn>
          </div>
        </Modal>
      )}
    </Page>
  );
};
