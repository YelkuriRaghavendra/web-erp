import { Page, Modal, Field, Row, Btn } from '../../shared/components/ui';
import { useAccounts, TXN_TYPES } from './useAccounts';

const fmt = (n: number) => `₹${n.toLocaleString()}`;

const LedgerRow = ({
  label,
  value,
  sign,
  isTotal,
  color,
}: {
  label: string;
  value: number;
  sign?: '+' | '−';
  isTotal?: boolean;
  color?: string;
}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: isTotal ? '10px 0 0' : '5px 0',
      borderTop: isTotal ? '1.5px solid var(--border2)' : 'none',
      marginTop: isTotal ? 6 : 0,
    }}
  >
    <span
      style={{
        fontSize: isTotal ? 13 : 12,
        fontWeight: isTotal ? 800 : 500,
        color: isTotal ? 'var(--ink)' : 'var(--ink2)',
      }}
    >
      {sign && (
        <span style={{ color: sign === '+' ? 'var(--green)' : 'var(--red)', marginRight: 4, fontWeight: 700 }}>
          {sign}
        </span>
      )}
      {label}
    </span>
    <span
      style={{
        fontFamily: "'JetBrains Mono',monospace",
        fontWeight: isTotal ? 900 : 600,
        fontSize: isTotal ? 16 : 12,
        color: color ?? (isTotal ? 'var(--ink)' : value === 0 ? 'var(--ink3)' : 'var(--ink)'),
      }}
    >
      {value === 0 && !isTotal ? '—' : fmt(value)}
    </span>
  </div>
);

const ActionBtn = ({
  label,
  sub,
  color,
  onClick,
}: {
  label: string;
  sub: string;
  color: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    style={{
      flex: 1,
      minWidth: 120,
      padding: '12px 14px',
      borderRadius: 10,
      border: `1.5px solid`,
      borderColor: `${color}33`,
      background: `${color}0d`,
      cursor: 'pointer',
      textAlign: 'left',
      fontFamily: "'Plus Jakarta Sans',sans-serif",
    }}
  >
    <div style={{ fontSize: 13, fontWeight: 800, color }}>{label}</div>
    <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2 }}>{sub}</div>
  </button>
);

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
    mAddToBank,
    mAddToCash,
    currentMonth,
    selectedMonth,
    thisMonth,
    prevMonth,
    nextMonth,
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

  const [y, m] = currentMonth.split('-');
  const monthLabel = new Date(+y, +m - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  const MonthNav = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button onClick={prevMonth} style={{ border: '1px solid var(--border)', background: 'var(--canvas)', borderRadius: 8, padding: '5px 11px', cursor: 'pointer', fontSize: 15, color: 'var(--ink2)' }}>‹</button>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', minWidth: 100, textAlign: 'center' }}>{monthLabel}</span>
      <button onClick={nextMonth} disabled={selectedMonth >= thisMonth} style={{ border: '1px solid var(--border)', background: 'var(--canvas)', borderRadius: 8, padding: '5px 11px', cursor: selectedMonth >= thisMonth ? 'not-allowed' : 'pointer', fontSize: 15, color: selectedMonth >= thisMonth ? 'var(--ink3)' : 'var(--ink2)', opacity: selectedMonth >= thisMonth ? 0.4 : 1 }}>›</button>
    </div>
  );

  const selectedType = TXN_TYPES.find(t => t.id === txnForm.type);

  // Group TXN_TYPES for display
  const TRANSFER_TYPES = TXN_TYPES.filter(t =>
    ['CASH_TO_BANK', 'BANK_TO_CASH', 'ADD_TO_BANK', 'ADD_TO_CASH'].includes(t.id)
  );
  const EXPENSE_TYPES = TXN_TYPES.filter(t =>
    ['EXPENSE_CASH', 'EXPENSE_BANK'].includes(t.id)
  );

  const fmtDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <Page title='Cash & Bank' subtitle={`Live balances · ${monthLabel}`} action={MonthNav}>

      {/* ── Balance ledger cards ──────────────────────────── */}
      <div className='erp-grid-2' style={{ gap: 16 }}>

        {/* Cash in Hand */}
        <div
          style={{
            background: 'var(--canvas)',
            border: '1px solid var(--border)',
            borderTop: '3px solid var(--green)',
            borderRadius: 14,
            padding: '22px 24px',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                Cash in Hand
              </div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: currentCash >= 0 ? 'var(--green)' : 'var(--red)',
                  fontFamily: "'JetBrains Mono',monospace",
                  lineHeight: 1.1,
                  marginTop: 4,
                }}
              >
                {fmt(currentCash)}
              </div>
            </div>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'var(--greenbg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
              }}
            >
              💵
            </div>
          </div>

          {/* Ledger breakdown */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 0 }}>
            <LedgerRow label='Opening Balance' value={cashOB} />
            <LedgerRow label='Cash Sales' value={mCashSales} sign='+' />
            {mBankToCash > 0 && <LedgerRow label='Bank Withdrawals' value={mBankToCash} sign='+' />}
            {mAddToCash > 0 && <LedgerRow label='Cash Added' value={mAddToCash} sign='+' />}
            {mCashToBank > 0 && <LedgerRow label='Deposited to Bank' value={mCashToBank} sign='−' />}
            {mExpCash > 0 && <LedgerRow label='Cash Expenses' value={mExpCash} sign='−' />}
            <LedgerRow label='Closing Balance' value={currentCash} isTotal color={currentCash >= 0 ? 'var(--green)' : 'var(--red)'} />
          </div>

          {/* Cash actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <ActionBtn
              label='Deposit to Bank'
              sub='Cash in hand → Bank'
              color='var(--blue)'
              onClick={() => openTxnModal('CASH_TO_BANK')}
            />
            <ActionBtn
              label='Add Cash'
              sub='Add external cash'
              color='var(--green)'
              onClick={() => openTxnModal('ADD_TO_CASH')}
            />
          </div>
        </div>

        {/* Bank Account */}
        <div
          style={{
            background: 'var(--canvas)',
            border: '1px solid var(--border)',
            borderTop: '3px solid var(--blue)',
            borderRadius: 14,
            padding: '22px 24px',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                Bank Account
              </div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: currentBank >= 0 ? 'var(--blue)' : 'var(--red)',
                  fontFamily: "'JetBrains Mono',monospace",
                  lineHeight: 1.1,
                  marginTop: 4,
                }}
              >
                {fmt(currentBank)}
              </div>
            </div>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'var(--bluebg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
              }}
            >
              🏦
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 0 }}>
            <LedgerRow label='Opening Balance' value={bankOB} />
            <LedgerRow label='UPI / Online Sales' value={mUpiSales} sign='+' />
            {mCashToBank > 0 && <LedgerRow label='Cash Deposited' value={mCashToBank} sign='+' />}
            {mAddToBank > 0 && <LedgerRow label='Cash Added to Bank' value={mAddToBank} sign='+' />}
            {mBankToCash > 0 && <LedgerRow label='Withdrawn to Cash' value={mBankToCash} sign='−' />}
            {mExpBank > 0 && <LedgerRow label='Bank Expenses' value={mExpBank} sign='−' />}
            <LedgerRow label='Closing Balance' value={currentBank} isTotal color={currentBank >= 0 ? 'var(--blue)' : 'var(--red)'} />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <ActionBtn
              label='Add to Bank'
              sub='Deposit cash to bank'
              color='var(--blue)'
              onClick={() => openTxnModal('ADD_TO_BANK')}
            />
            <ActionBtn
              label='Withdraw'
              sub='Bank → Cash in hand'
              color='var(--green)'
              onClick={() => openTxnModal('BANK_TO_CASH')}
            />
          </div>
        </div>
      </div>

      {/* ── Total Funds + OB button ───────────────────────── */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div
          style={{
            flex: 1,
            background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
            borderRadius: 14,
            padding: '18px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 6px 20px rgba(124,58,237,.2)',
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.65)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
              Total Funds
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.1, marginTop: 4 }}>
              {fmt(currentCash + currentBank)}
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', textAlign: 'right' }}>
            <div>Cash {fmt(currentCash)}</div>
            <div>Bank {fmt(currentBank)}</div>
          </div>
        </div>
        <button
          onClick={openOBModal}
          style={{
            padding: '12px 18px',
            borderRadius: 10,
            border: '1px solid var(--border2)',
            background: 'var(--canvas)',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--ink2)',
            cursor: 'pointer',
            fontFamily: "'Plus Jakarta Sans',sans-serif",
            whiteSpace: 'nowrap',
          }}
        >
          ⚙ Opening Balance
        </button>
      </div>

      {/* ── Expense quick actions ─────────────────────────── */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>
          Record Expense
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {EXPENSE_TYPES.map(t => (
            <ActionBtn
              key={t.id}
              label={t.label}
              sub={t.id === 'EXPENSE_CASH' ? 'Deduct from cash' : 'Deduct from bank'}
              color='var(--red)'
              onClick={() => openTxnModal(t.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Transaction history ───────────────────────────── */}
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
          <span style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 600, background: 'var(--bg)', padding: '3px 10px', borderRadius: 99 }}>
            {txnHistory.length} entries
          </span>
        </div>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: 520, borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                {['Date', 'Type', 'Note', 'Cash Effect', 'Bank Effect', 'Amount'].map(h => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 16px',
                      textAlign: ['Cash Effect', 'Bank Effect', 'Amount'].includes(h) ? 'right' : 'left',
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
              {txnHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--ink3)' }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
                    No transactions yet. Use the action buttons above.
                  </td>
                </tr>
              ) : (
                txnHistory.map((t, i) => {
                  const def = TXN_TYPES.find(x => x.id === t.type);
                  const cashEff = (def?.cashEffect ?? 0) * t.amount;
                  const bankEff = (def?.bankEffect ?? 0) * t.amount;
                  const colorMap: Record<string, { bg: string; color: string }> = {
                    blue: { bg: 'var(--bluebg)', color: 'var(--blue)' },
                    green: { bg: 'var(--greenbg)', color: 'var(--green)' },
                    red: { bg: 'var(--redbg)', color: 'var(--red)' },
                    amber: { bg: 'var(--amberbg)', color: 'var(--amber)' },
                  };
                  const c = colorMap[def?.color ?? 'blue'];
                  return (
                    <tr
                      key={t.id}
                      style={{ borderBottom: i < txnHistory.length - 1 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'var(--canvas)')}
                    >
                      <td style={{ padding: '11px 16px', color: 'var(--ink3)', fontSize: 12, fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap' }}>
                        {fmtDate(t.date)}
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>
                          {def?.icon ?? ''} {def?.label ?? t.type}
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px', color: 'var(--ink2)', maxWidth: 200 }}>
                        {t.note || <span style={{ color: 'var(--ink3)', fontStyle: 'italic' }}>—</span>}
                      </td>
                      <td style={{ padding: '11px 16px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: cashEff > 0 ? 'var(--green)' : cashEff < 0 ? 'var(--red)' : 'var(--ink3)', whiteSpace: 'nowrap' }}>
                        {cashEff !== 0 ? `${cashEff > 0 ? '+' : ''}${fmt(Math.abs(cashEff))}` : '—'}
                      </td>
                      <td style={{ padding: '11px 16px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: bankEff > 0 ? 'var(--blue)' : bankEff < 0 ? 'var(--red)' : 'var(--ink3)', whiteSpace: 'nowrap' }}>
                        {bankEff !== 0 ? `${bankEff > 0 ? '+' : ''}${fmt(Math.abs(bankEff))}` : '—'}
                      </td>
                      <td style={{ padding: '11px 16px', textAlign: 'right', fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, whiteSpace: 'nowrap' }}>
                        {fmt(t.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Transaction entry modal ────────────────────────── */}
      {txnModal && (
        <Modal title='Record Transaction' onClose={() => setTxnModal(false)} width={500}>
          {/* Type groups */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 4 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>
                Transfer / Add
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                {TRANSFER_TYPES.map(t => {
                  const active = txnForm.type === t.id;
                  const accentMap: Record<string, string> = { blue: 'var(--blue)', green: 'var(--green)', red: 'var(--red)', amber: 'var(--amber)' };
                  const bgMap: Record<string, string> = { blue: 'var(--bluebg)', green: 'var(--greenbg)', red: 'var(--redbg)', amber: 'var(--amberbg)' };
                  return (
                    <button key={t.id} onClick={() => setTxnField('type', t.id)} style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer', border: `2px solid ${active ? accentMap[t.color] : 'var(--border)'}`, background: active ? bgMap[t.color] : 'var(--canvas)', fontWeight: 700, fontSize: 12, color: active ? accentMap[t.color] : 'var(--ink3)', fontFamily: "'Plus Jakarta Sans',sans-serif", textAlign: 'center' }}>
                      <div style={{ fontSize: 20, marginBottom: 3 }}>{t.icon}</div>
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>
                Expenses
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                {EXPENSE_TYPES.map(t => {
                  const active = txnForm.type === t.id;
                  const accentMap: Record<string, string> = { blue: 'var(--blue)', green: 'var(--green)', red: 'var(--red)', amber: 'var(--amber)' };
                  const bgMap: Record<string, string> = { blue: 'var(--bluebg)', green: 'var(--greenbg)', red: 'var(--redbg)', amber: 'var(--amberbg)' };
                  return (
                    <button key={t.id} onClick={() => setTxnField('type', t.id)} style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer', border: `2px solid ${active ? accentMap[t.color] : 'var(--border)'}`, background: active ? bgMap[t.color] : 'var(--canvas)', fontWeight: 700, fontSize: 12, color: active ? accentMap[t.color] : 'var(--ink3)', fontFamily: "'Plus Jakarta Sans',sans-serif", textAlign: 'center' }}>
                      <div style={{ fontSize: 20, marginBottom: 3 }}>{t.icon}</div>
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Effect preview */}
          {selectedType && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--ink3)', display: 'flex', gap: 20 }}>
              <span>💵 Cash: <strong style={{ color: selectedType.cashEffect > 0 ? 'var(--green)' : selectedType.cashEffect < 0 ? 'var(--red)' : 'var(--ink3)' }}>{selectedType.cashEffect > 0 ? '+' : selectedType.cashEffect < 0 ? '−' : '±'}0</strong></span>
              <span>🏦 Bank: <strong style={{ color: selectedType.bankEffect > 0 ? 'var(--blue)' : selectedType.bankEffect < 0 ? 'var(--red)' : 'var(--ink3)' }}>{selectedType.bankEffect > 0 ? '+' : selectedType.bankEffect < 0 ? '−' : '±'}0</strong></span>
            </div>
          )}

          <Row>
            <Field label='Date' type='date' value={txnForm.date} onChange={v => setTxnField('date', v)} />
            <Field label='Amount (₹)' type='number' value={txnForm.amount} onChange={v => setTxnField('amount', v)} placeholder='0' required />
          </Row>
          <Field label='Note / Description' value={txnForm.note} onChange={v => setTxnField('note', v)} placeholder='Optional description…' />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
            <Btn variant='ghost' onClick={() => setTxnModal(false)}>Cancel</Btn>
            <Btn onClick={addTransaction}>Record Transaction</Btn>
          </div>
        </Modal>
      )}

      {/* ── Opening Balance modal ──────────────────────────── */}
      {obModal && (
        <Modal title={`Opening Balance — ${monthLabel}`} onClose={() => setObModal(false)} width={400}>
          <div style={{ fontSize: 13, color: 'var(--ink3)', padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
            Set the starting cash and bank balance at the beginning of {monthLabel}.
          </div>
          <Row>
            <Field label='Cash Opening (₹)' type='number' value={obForm.cash} onChange={v => setObForm(p => ({ ...p, cash: v }))} placeholder='0' />
            <Field label='Bank Opening (₹)' type='number' value={obForm.bank} onChange={v => setObForm(p => ({ ...p, bank: v }))} placeholder='0' />
          </Row>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant='ghost' onClick={() => setObModal(false)}>Cancel</Btn>
            <Btn onClick={saveOB}>Save Opening Balances</Btn>
          </div>
        </Modal>
      )}
    </Page>
  );
};
