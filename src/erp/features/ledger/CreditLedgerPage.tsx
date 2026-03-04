import {
  Page,
  StatCard,
  Btn,
  Modal,
  Field,
  Row,
  Badge,
} from '../../shared/components/ui';
import { useLedger } from './useLedger';

export const CreditLedgerPage = () => {
  const {
    creditCustomers,
    totalOutstanding,
    selectedCustomer,
    selectedId,
    setSelectedId,
    entryModal,
    entryForm,
    setEntry,
    openDebit,
    openCredit,
    closeEntry,
    addEntry,
    previewBalance,
  } = useLedger();

  return (
    <Page
      title='Credit Ledger'
      subtitle='Credit accounts are created automatically when a credit bill is raised'
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <StatCard
          icon='📋'
          label='Credit Accounts'
          value={creditCustomers.length}
          sub='Active accounts'
          color='orange'
        />
        <StatCard
          icon='⚠️'
          label='Total Outstanding'
          value={`₹${totalOutstanding.toLocaleString()}`}
          sub='Across all accounts'
          color='red'
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* Account list */}
        <div
          style={{
            background: 'var(--canvas)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--bg)',
              borderBottom: '1px solid var(--border)',
              fontSize: 11,
              fontWeight: 800,
              color: 'var(--ink3)',
              textTransform: 'uppercase',
              letterSpacing: '.07em',
            }}
          >
            Accounts
          </div>
          {creditCustomers.length === 0 ? (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: 'var(--ink3)',
                fontSize: 13,
              }}
            >
              No credit accounts yet — raise a credit bill to create one
            </div>
          ) : (
            creditCustomers.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  background:
                    selectedId === c.id ? 'var(--accentbg)' : 'var(--canvas)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onMouseEnter={e => {
                  if (selectedId !== c.id)
                    e.currentTarget.style.background = 'var(--bg)';
                }}
                onMouseLeave={e => {
                  if (selectedId !== c.id)
                    e.currentTarget.style.background = 'var(--canvas)';
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color:
                        selectedId === c.id ? 'var(--accent)' : 'var(--ink)',
                    }}
                  >
                    {c.name}
                  </div>
                  <div
                    style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2 }}
                  >
                    {c.phone || 'No phone'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: c.outstanding > 0 ? 'var(--red)' : 'var(--green)',
                    }}
                  >
                    ₹{c.outstanding.toLocaleString()}
                  </div>
                  <div
                    style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 1 }}
                  >
                    {c.outstanding > 0 ? 'due' : 'clear'}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Ledger detail */}
        {!selectedCustomer ? (
          <div
            style={{
              background: 'var(--canvas)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '80px 40px',
              textAlign: 'center',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📒</div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--ink)',
                marginBottom: 8,
              }}
            >
              Select an account
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink3)' }}>
              Choose a credit account from the left to view its ledger
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                background: 'var(--canvas)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '20px 24px',
                boxShadow: 'var(--shadow)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: 'var(--ink)',
                    }}
                  >
                    {selectedCustomer.name}
                  </div>
                  <div
                    style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 4 }}
                  >
                    {selectedCustomer.phone || 'No phone'} · Since{' '}
                    {selectedCustomer.joinDate}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: 'var(--ink3)',
                      textTransform: 'uppercase',
                      letterSpacing: '.07em',
                      marginBottom: 4,
                    }}
                  >
                    Outstanding Balance
                  </div>
                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: 900,
                      color:
                        selectedCustomer.outstanding > 0
                          ? 'var(--red)'
                          : 'var(--green)',
                    }}
                  >
                    ₹{selectedCustomer.outstanding.toLocaleString()}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <Btn onClick={openDebit}>+ Add Debit Entry</Btn>
                <Btn variant='success' onClick={openCredit}>
                  ✓ Record Payment
                </Btn>
              </div>
            </div>

            {!selectedCustomer.ledger ||
            selectedCustomer.ledger.length === 0 ? (
              <div
                style={{
                  background: 'var(--canvas)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '60px 40px',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow)',
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <div style={{ fontWeight: 700, color: 'var(--ink3)' }}>
                  No entries yet. Add a debit to start tracking.
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: 'var(--canvas)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow)',
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 13.5,
                  }}
                >
                  <thead>
                    <tr style={{ background: 'var(--bg)' }}>
                      {[
                        'Date',
                        'Type',
                        'Description',
                        'Debit (₹)',
                        'Credit (₹)',
                        'Balance (₹)',
                      ].map(h => (
                        <th
                          key={h}
                          style={{
                            padding: '10px 16px',
                            textAlign: [
                              'Debit (₹)',
                              'Credit (₹)',
                              'Balance (₹)',
                            ].includes(h)
                              ? 'right'
                              : 'left',
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
                    {[...selectedCustomer.ledger].reverse().map((e, i, arr) => (
                      <tr
                        key={e.id}
                        style={{
                          borderBottom:
                            i < arr.length - 1
                              ? '1px solid var(--border)'
                              : 'none',
                          background: 'var(--canvas)',
                          transition: 'background .1s',
                        }}
                        onMouseEnter={ev =>
                          (ev.currentTarget.style.background = 'var(--bg)')
                        }
                        onMouseLeave={ev =>
                          (ev.currentTarget.style.background = 'var(--canvas)')
                        }
                      >
                        <td
                          style={{
                            padding: '11px 16px',
                            color: 'var(--ink3)',
                            fontSize: 12,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {e.date}
                        </td>
                        <td style={{ padding: '11px 16px' }}>
                          <Badge
                            label={e.type}
                            color={e.type === 'DEBIT' ? 'red' : 'green'}
                          />
                        </td>
                        <td
                          style={{ padding: '11px 16px', color: 'var(--ink2)' }}
                        >
                          {e.description || (
                            <span
                              style={{
                                color: 'var(--ink3)',
                                fontStyle: 'italic',
                              }}
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
                            color: 'var(--red)',
                          }}
                        >
                          {e.type === 'DEBIT'
                            ? `₹${e.amount.toLocaleString()}`
                            : '—'}
                        </td>
                        <td
                          style={{
                            padding: '11px 16px',
                            textAlign: 'right',
                            fontFamily: "'JetBrains Mono',monospace",
                            fontWeight: 700,
                            color: 'var(--green)',
                          }}
                        >
                          {e.type === 'CREDIT'
                            ? `₹${e.amount.toLocaleString()}`
                            : '—'}
                        </td>
                        <td
                          style={{
                            padding: '11px 16px',
                            textAlign: 'right',
                            fontFamily: "'JetBrains Mono',monospace",
                            fontWeight: 800,
                            color:
                              e.balance > 0 ? 'var(--ink)' : 'var(--green)',
                          }}
                        >
                          ₹{e.balance.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr
                      style={{
                        background: 'var(--redbg)',
                        borderTop: '2px solid var(--redbd)',
                      }}
                    >
                      <td
                        colSpan={3}
                        style={{
                          padding: '12px 16px',
                          fontWeight: 800,
                          color: 'var(--red)',
                        }}
                      >
                        Closing Balance
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          textAlign: 'right',
                          fontFamily: "'JetBrains Mono',monospace",
                          fontWeight: 800,
                          color: 'var(--red)',
                        }}
                      >
                        ₹
                        {selectedCustomer.ledger
                          .reduce(
                            (s, e) => (e.type === 'DEBIT' ? s + e.amount : s),
                            0
                          )
                          .toLocaleString()}
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          textAlign: 'right',
                          fontFamily: "'JetBrains Mono',monospace",
                          fontWeight: 800,
                          color: 'var(--green)',
                        }}
                      >
                        ₹
                        {selectedCustomer.ledger
                          .reduce(
                            (s, e) => (e.type === 'CREDIT' ? s + e.amount : s),
                            0
                          )
                          .toLocaleString()}
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          textAlign: 'right',
                          fontFamily: "'JetBrains Mono',monospace",
                          fontWeight: 900,
                          fontSize: 16,
                          color:
                            selectedCustomer.outstanding > 0
                              ? 'var(--red)'
                              : 'var(--green)',
                        }}
                      >
                        ₹{selectedCustomer.outstanding.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {entryModal && (
        <Modal
          title={
            entryForm.type === 'DEBIT'
              ? 'Add Debit Entry'
              : 'Record Payment Collection'
          }
          onClose={closeEntry}
          width={440}
        >
          <div
            style={{
              background:
                entryForm.type === 'DEBIT' ? 'var(--redbg)' : 'var(--greenbg)',
              border: `1px solid ${entryForm.type === 'DEBIT' ? 'var(--redbd)' : 'var(--greenbd)'}`,
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              color: entryForm.type === 'DEBIT' ? 'var(--red)' : 'var(--green)',
              fontWeight: 600,
            }}
          >
            {entryForm.type === 'DEBIT'
              ? '📋 DEBIT — goods/credit given to customer (increases outstanding)'
              : '✓ CREDIT — payment collected from customer (reduces outstanding)'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['DEBIT', 'CREDIT'] as const).map(t => (
              <button
                key={t}
                onClick={() => setEntry('type', t)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 8,
                  border: `2px solid ${entryForm.type === t ? (t === 'DEBIT' ? 'var(--red)' : 'var(--green)') : 'var(--border)'}`,
                  background:
                    entryForm.type === t
                      ? t === 'DEBIT'
                        ? 'var(--redbg)'
                        : 'var(--greenbg)'
                      : 'var(--canvas)',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  color:
                    entryForm.type === t
                      ? t === 'DEBIT'
                        ? 'var(--red)'
                        : 'var(--green)'
                      : 'var(--ink3)',
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                }}
              >
                {t === 'DEBIT' ? '📋 Debit' : '✓ Payment'}
              </button>
            ))}
          </div>
          <Row>
            <Field
              label='Date'
              type='date'
              value={entryForm.date}
              onChange={v => setEntry('date', v)}
            />
            <Field
              label='Amount (₹)'
              type='number'
              value={entryForm.amount}
              onChange={v => setEntry('amount', v)}
              placeholder='0'
              required
            />
          </Row>
          <Field
            label='Description'
            value={entryForm.description}
            onChange={v => setEntry('description', v)}
            placeholder={
              entryForm.type === 'DEBIT'
                ? 'e.g. 2× 14.2 KG Cylinder'
                : 'e.g. Cash payment received'
            }
          />
          {selectedCustomer && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'var(--bg)',
                borderRadius: 8,
                border: '1px solid var(--border)',
              }}
            >
              <span
                style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink3)' }}
              >
                Current Outstanding
              </span>
              <span style={{ fontWeight: 800, color: 'var(--red)' }}>
                ₹{selectedCustomer.outstanding.toLocaleString()}
              </span>
            </div>
          )}
          {previewBalance !== null && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background:
                  entryForm.type === 'DEBIT'
                    ? 'var(--redbg)'
                    : 'var(--greenbg)',
                borderRadius: 8,
                border: `1px solid ${entryForm.type === 'DEBIT' ? 'var(--redbd)' : 'var(--greenbd)'}`,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color:
                    entryForm.type === 'DEBIT' ? 'var(--red)' : 'var(--green)',
                }}
              >
                New Balance After This Entry
              </span>
              <span
                style={{
                  fontWeight: 900,
                  fontSize: 15,
                  color:
                    entryForm.type === 'DEBIT' ? 'var(--red)' : 'var(--green)',
                }}
              >
                ₹{previewBalance.toLocaleString()}
              </span>
            </div>
          )}
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
            <Btn variant='ghost' onClick={closeEntry}>
              Cancel
            </Btn>
            <Btn
              variant={entryForm.type === 'DEBIT' ? 'primary' : 'success'}
              onClick={addEntry}
            >
              {entryForm.type === 'DEBIT' ? 'Add Debit' : 'Record Payment'}
            </Btn>
          </div>
        </Modal>
      )}
    </Page>
  );
};
