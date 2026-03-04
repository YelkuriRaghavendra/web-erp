import { Page, Modal, Field, Row, Btn } from '../../shared/components/ui';
import { useAccounts, TXN_TYPES } from './useAccounts';

// ── Small inline badge for transaction type ────────────────────
const TxnBadge = ({ type }: { type: string }) => {
  const def = TXN_TYPES.find(t => t.id === type);
  const colorMap: Record<string, { bg: string; color: string }> = {
    blue: { bg: 'var(--bluebg,#eff6ff)', color: 'var(--blue,#3b82f6)' },
    green: { bg: 'var(--greenbg)', color: 'var(--green)' },
    red: { bg: 'var(--redbg)', color: 'var(--red)' },
    amber: { bg: 'var(--amberbg,#fffbeb)', color: 'var(--amber,#d97706)' },
  };
  const c = colorMap[def?.color ?? 'blue'];
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: '3px 8px',
        borderRadius: 6,
        background: c.bg,
        color: c.color,
        whiteSpace: 'nowrap',
      }}
    >
      {def?.icon ?? ''} {def?.label ?? type}
    </span>
  );
};

export const AccountsPage = () => {
  const {
    currentCash,
    currentBank,
    cashOB,
    bankOB,
    mCashSales,
    mUpiSales,
    mCashToBank,
    mBankToCash,
    mExpCash,
    mExpBank,
    todayCash,
    todayUPI,
    todayDeposits,
    todayWithdrawals,
    todayExpenses,
    currentMonth,
    txnHistory,
    txnModal,
    txnForm,
    setTxnField,
    addTransaction,
    openTxnModal,
    setTxnModal,
    obModal,
    obForm,
    setObForm,
    openOBModal,
    saveOB,
    setObModal,
  } = useAccounts();

  // Month label
  const [y, m] = currentMonth.split('-');
  const monthLabel = new Date(+y, +m - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  const selectedType = TXN_TYPES.find(t => t.id === txnForm.type);

  return (
    <Page title='Cash & Bank' subtitle={`Live balances for ${monthLabel}`}>
      {/* ── Balance cards ─────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }}
      >
        {/* Cash in Hand */}
        <div
          style={{
            borderRadius: 16,
            padding: '24px 28px',
            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
            boxShadow: '0 8px 24px rgba(22,163,74,.25)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(255,255,255,.08)',
            }}
          />
          <div style={{ fontSize: 28, marginBottom: 8 }}>💵</div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'rgba(255,255,255,.7)',
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              marginBottom: 6,
            }}
          >
            Cash in Hand
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: '#fff',
              fontFamily: "'JetBrains Mono',monospace",
              lineHeight: 1,
            }}
          >
            ₹{currentCash.toLocaleString()}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,.55)',
              marginTop: 8,
            }}
          >
            OB ₹{cashOB.toLocaleString()} + Sales ₹{mCashSales.toLocaleString()}
          </div>
        </div>

        {/* Bank Account */}
        <div
          style={{
            borderRadius: 16,
            padding: '24px 28px',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            boxShadow: '0 8px 24px rgba(37,99,235,.25)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(255,255,255,.08)',
            }}
          />
          <div style={{ fontSize: 28, marginBottom: 8 }}>🏦</div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'rgba(255,255,255,.7)',
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              marginBottom: 6,
            }}
          >
            Bank Account
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: '#fff',
              fontFamily: "'JetBrains Mono',monospace",
              lineHeight: 1,
            }}
          >
            ₹{currentBank.toLocaleString()}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,.55)',
              marginTop: 8,
            }}
          >
            OB ₹{bankOB.toLocaleString()} + UPI ₹{mUpiSales.toLocaleString()}
          </div>
        </div>

        {/* Total */}
        <div
          style={{
            borderRadius: 16,
            padding: '24px 28px',
            background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
            boxShadow: '0 8px 24px rgba(124,58,237,.25)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(255,255,255,.08)',
            }}
          />
          <div style={{ fontSize: 28, marginBottom: 8 }}>💼</div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'rgba(255,255,255,.7)',
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              marginBottom: 6,
            }}
          >
            Total Funds
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: '#fff',
              fontFamily: "'JetBrains Mono',monospace",
              lineHeight: 1,
            }}
          >
            ₹{(currentCash + currentBank).toLocaleString()}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,.55)',
              marginTop: 8,
            }}
          >
            Cash + Bank combined
          </div>
        </div>
      </div>

      {/* ── Today's activity + Month summary ─────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Today */}
        <div
          style={{
            background: 'var(--canvas)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '20px 24px',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: 'var(--ink)',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            📅 Today's Activity
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              {
                label: 'Cash Sales',
                value: todayCash,
                color: 'var(--green)',
                icon: '💵',
              },
              {
                label: 'UPI Sales',
                value: todayUPI,
                color: 'var(--blue)',
                icon: '📲',
              },
              {
                label: 'Deposits',
                value: todayDeposits,
                color: 'var(--blue)',
                icon: '⬆',
              },
              {
                label: 'Withdrawals',
                value: todayWithdrawals,
                color: 'var(--green)',
                icon: '⬇',
              },
              {
                label: 'Expenses',
                value: todayExpenses,
                color: 'var(--red)',
                icon: '📤',
              },
            ].map(r => (
              <div
                key={r.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--ink2)' }}>
                  {r.icon} {r.label}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontWeight: 700,
                    fontSize: 13,
                    color: r.value > 0 ? r.color : 'var(--ink3)',
                  }}
                >
                  {r.value > 0 ? `₹${r.value.toLocaleString()}` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Month summary */}
        <div
          style={{
            background: 'var(--canvas)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '20px 24px',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: 'var(--ink)',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            📊 {monthLabel} Summary
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              {
                label: 'Cash Sales',
                value: mCashSales,
                color: 'var(--green)',
                icon: '💵',
              },
              {
                label: 'UPI / Bank',
                value: mUpiSales,
                color: 'var(--blue)',
                icon: '🏦',
              },
              {
                label: 'Deposited',
                value: mCashToBank,
                color: 'var(--blue)',
                icon: '⬆',
              },
              {
                label: 'Withdrawn',
                value: mBankToCash,
                color: 'var(--green)',
                icon: '⬇',
              },
              {
                label: 'Cash Expenses',
                value: mExpCash,
                color: 'var(--red)',
                icon: '💸',
              },
              {
                label: 'Bank Expenses',
                value: mExpBank,
                color: 'var(--red)',
                icon: '🏦📤',
              },
            ].map(r => (
              <div
                key={r.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--ink2)' }}>
                  {r.icon} {r.label}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontWeight: 700,
                    fontSize: 13,
                    color: r.value > 0 ? r.color : 'var(--ink3)',
                  }}
                >
                  {r.value > 0 ? `₹${r.value.toLocaleString()}` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick-action buttons ──────────────────────────── */}
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: 'var(--ink)',
            marginBottom: 12,
          }}
        >
          Quick Actions
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
          }}
        >
          {TXN_TYPES.map(t => {
            const bgMap: Record<string, string> = {
              blue: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              green: 'linear-gradient(135deg,#16a34a,#15803d)',
              red: 'linear-gradient(135deg,#dc2626,#b91c1c)',
              amber: 'linear-gradient(135deg,#d97706,#b45309)',
            };
            return (
              <button
                key={t.id}
                onClick={() => openTxnModal(t.id)}
                style={{
                  padding: '16px 12px',
                  borderRadius: 12,
                  border: 'none',
                  background: bgMap[t.color],
                  color: '#fff',
                  cursor: 'pointer',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,.15)',
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 6 }}>{t.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>
                  {t.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Set Opening Balance ───────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={openOBModal}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--ink3)',
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '7px 14px',
            cursor: 'pointer',
            fontFamily: "'Plus Jakarta Sans',sans-serif",
          }}
        >
          ⚙ Set Opening Balance — {monthLabel}
        </button>
      </div>

      {/* ── Transaction history ───────────────────────────── */}
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
            Transaction History
          </div>
          <span style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 600 }}>
            {txnHistory.length} entries
          </span>
        </div>
        <table
          style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}
        >
          <thead>
            <tr style={{ background: 'var(--bg)' }}>
              {[
                'Date',
                'Type',
                'Note',
                'Cash Effect',
                'Bank Effect',
                'Amount',
              ].map(h => (
                <th
                  key={h}
                  style={{
                    padding: '10px 16px',
                    textAlign: [
                      'Cash Effect',
                      'Bank Effect',
                      'Amount',
                    ].includes(h)
                      ? 'right'
                      : 'left',
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
            {txnHistory.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: '48px',
                    textAlign: 'center',
                    color: 'var(--ink3)',
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
                  No transactions yet. Use the quick-action buttons above to
                  record one.
                </td>
              </tr>
            ) : (
              txnHistory.map((t, i) => {
                const def = TXN_TYPES.find(x => x.id === t.type)!;
                const cashEff = def.cashEffect * t.amount;
                const bankEff = def.bankEffect * t.amount;
                return (
                  <tr
                    key={t.id}
                    style={{
                      borderBottom:
                        i < txnHistory.length - 1
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
                        color: 'var(--ink3)',
                        fontSize: 12,
                        fontFamily: "'JetBrains Mono',monospace",
                      }}
                    >
                      {t.date}
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <TxnBadge type={t.type} />
                    </td>
                    <td style={{ padding: '11px 16px', color: 'var(--ink2)' }}>
                      {t.note || (
                        <span
                          style={{ color: 'var(--ink3)', fontStyle: 'italic' }}
                        >
                          —
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: '11px 16px',
                        textAlign: 'right',
                        fontFamily: "'JetBrains Mono',monospace",
                        fontWeight: 700,
                        color:
                          cashEff > 0
                            ? 'var(--green)'
                            : cashEff < 0
                              ? 'var(--red)'
                              : 'var(--ink3)',
                      }}
                    >
                      {cashEff !== 0
                        ? `${cashEff > 0 ? '+' : ''}₹${Math.abs(cashEff).toLocaleString()}`
                        : '—'}
                    </td>
                    <td
                      style={{
                        padding: '11px 16px',
                        textAlign: 'right',
                        fontFamily: "'JetBrains Mono',monospace",
                        fontWeight: 700,
                        color:
                          bankEff > 0
                            ? 'var(--blue)'
                            : bankEff < 0
                              ? 'var(--red)'
                              : 'var(--ink3)',
                      }}
                    >
                      {bankEff !== 0
                        ? `${bankEff > 0 ? '+' : ''}₹${Math.abs(bankEff).toLocaleString()}`
                        : '—'}
                    </td>
                    <td
                      style={{
                        padding: '11px 16px',
                        textAlign: 'right',
                        fontFamily: "'JetBrains Mono',monospace",
                        fontWeight: 800,
                      }}
                    >
                      ₹{t.amount.toLocaleString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Transaction entry modal ────────────────────────── */}
      {txnModal && (
        <Modal
          title='Record Transaction'
          onClose={() => setTxnModal(false)}
          width={480}
        >
          {/* Type selector */}
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
          >
            {TXN_TYPES.map(t => {
              const active = txnForm.type === t.id;
              const accentMap: Record<string, string> = {
                blue: 'var(--blue,#3b82f6)',
                green: 'var(--green)',
                red: 'var(--red)',
                amber: 'var(--amber,#d97706)',
              };
              const bgMap: Record<string, string> = {
                blue: 'var(--bluebg,#eff6ff)',
                green: 'var(--greenbg)',
                red: 'var(--redbg)',
                amber: 'var(--amberbg,#fffbeb)',
              };
              return (
                <button
                  key={t.id}
                  onClick={() => setTxnField('type', t.id)}
                  style={{
                    padding: '12px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    border: `2px solid ${active ? accentMap[t.color] : 'var(--border)'}`,
                    background: active ? bgMap[t.color] : 'var(--canvas)',
                    fontWeight: 700,
                    fontSize: 12,
                    color: active ? accentMap[t.color] : 'var(--ink3)',
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{t.icon}</div>
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Effect preview */}
          {selectedType && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                fontSize: 12,
                color: 'var(--ink3)',
                display: 'flex',
                gap: 16,
              }}
            >
              <span>
                💵 Cash:{' '}
                <strong
                  style={{
                    color:
                      selectedType.cashEffect > 0
                        ? 'var(--green)'
                        : selectedType.cashEffect < 0
                          ? 'var(--red)'
                          : 'var(--ink3)',
                  }}
                >
                  {selectedType.cashEffect > 0
                    ? '+'
                    : selectedType.cashEffect < 0
                      ? '-'
                      : '±'}
                  0
                </strong>
              </span>
              <span>
                🏦 Bank:{' '}
                <strong
                  style={{
                    color:
                      selectedType.bankEffect > 0
                        ? 'var(--blue)'
                        : selectedType.bankEffect < 0
                          ? 'var(--red)'
                          : 'var(--ink3)',
                  }}
                >
                  {selectedType.bankEffect > 0
                    ? '+'
                    : selectedType.bankEffect < 0
                      ? '-'
                      : '±'}
                  0
                </strong>
              </span>
            </div>
          )}

          <Row>
            <Field
              label='Date'
              type='date'
              value={txnForm.date}
              onChange={v => setTxnField('date', v)}
            />
            <Field
              label='Amount (₹)'
              type='number'
              value={txnForm.amount}
              onChange={v => setTxnField('amount', v)}
              placeholder='0'
              required
            />
          </Row>
          <Field
            label='Note / Description'
            value={txnForm.note}
            onChange={v => setTxnField('note', v)}
            placeholder='Optional description…'
          />
          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'flex-end',
              borderTop: '1px solid var(--border)',
              paddingTop: 14,
              marginTop: 4,
            }}
          >
            <Btn variant='ghost' onClick={() => setTxnModal(false)}>
              Cancel
            </Btn>
            <Btn onClick={addTransaction}>Record Transaction</Btn>
          </div>
        </Modal>
      )}

      {/* ── Opening Balance modal ──────────────────────────── */}
      {obModal && (
        <Modal
          title={`Opening Balance — ${monthLabel}`}
          onClose={() => setObModal(false)}
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
            Set the starting cash and bank balance for {monthLabel}. This is the
            amount you had at the beginning of the month.
          </div>
          <Row>
            <Field
              label='Cash Opening (₹)'
              type='number'
              value={obForm.cash}
              onChange={v => setObForm(p => ({ ...p, cash: v }))}
              placeholder='0'
            />
            <Field
              label='Bank Opening (₹)'
              type='number'
              value={obForm.bank}
              onChange={v => setObForm(p => ({ ...p, bank: v }))}
              placeholder='0'
            />
          </Row>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant='ghost' onClick={() => setObModal(false)}>
              Cancel
            </Btn>
            <Btn onClick={saveOB}>Save Opening Balances</Btn>
          </div>
        </Modal>
      )}
    </Page>
  );
};
