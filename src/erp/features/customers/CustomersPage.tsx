import { Page, Table, Badge, Btn, Field, Modal, Row } from '../../shared/components/ui';
import { useCustomers }                               from './useCustomers';
import type { Customer }                              from '../../core/types';

type CustomerRow = Customer & Record<string, unknown>;

export const CustomersPage = () => {
  const {
    customers,
    addModal, openAdd, closeAdd,
    form, setField, isKanchi,
    addCustomer,
    payModal, openCollect, closeCollect,
    payAmt, setPayAmt,
    recordPayment,
  } = useCustomers();

  return (
    <Page
      title="Customers"
      subtitle={`${customers.length} customers · ${customers.filter(c => c.credit).length} credit accounts`}
      action={<Btn onClick={openAdd}>+ Add Customer</Btn>}
    >
      {customers.length === 0 ? (
        <div style={{ background:'var(--canvas)', border:'1px solid var(--border)', borderRadius:12, padding:'60px 40px', textAlign:'center', boxShadow:'var(--shadow)' }}>
          <div style={{ fontSize:48, marginBottom:14 }}>👥</div>
          <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>No customers yet</div>
          <div style={{ fontSize:14, color:'var(--ink3)', marginBottom:24 }}>Add your first customer to start billing</div>
          <Btn onClick={openAdd}>+ Add First Customer</Btn>
        </div>
      ) : (
        <Table<CustomerRow>
          cols={[
            { k:'name',        l:'Customer',    r:(v,r) => <span style={{ fontWeight:700 }}>{String(v)}{' '}{r.credit && <Badge label="Credit" color="red"/>}</span> },
            { k:'phone',       l:'Phone',       r:v  => <span style={{ color:'var(--ink3)', fontFamily:"'JetBrains Mono',monospace", fontSize:13 }}>{String(v||'—')}</span> },
            { k:'address',     l:'Address',     r:v  => <span style={{ color:'var(--ink3)', fontSize:13 }}>{String(v||'—')}</span> },
            { k:'outstanding', l:'Outstanding', right:true, r:v =>
              Number(v) > 0
                ? <span style={{ color:'var(--red)', fontWeight:800 }}>₹{Number(v).toLocaleString()}</span>
                : <span style={{ color:'var(--ink3)' }}>Nil</span>
            },
            { k:'joinDate',    l:'Joined',      r:v  => <span style={{ color:'var(--ink3)', fontSize:12 }}>{String(v)}</span> },
            { k:'id',          l:'',            r:(_,r) => (
              <div style={{ display:'flex', gap:6 }}>
                {Number(r.outstanding) > 0 && (
                  <Btn small variant="success" onClick={() => openCollect(r as unknown as Customer)}>Collect</Btn>
                )}
              </div>
            )},
          ]}
          rows={customers as unknown as CustomerRow[]}
        />
      )}

      {/* Add customer modal */}
      {addModal && (
        <Modal title="Add New Customer" onClose={closeAdd}>
          <Field label="Customer Name" value={form.name} onChange={v => setField('name', v)} required/>
          {isKanchi && (
            <div style={{ background:'var(--redbg)', border:'1px solid var(--redbd)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'var(--red)', fontWeight:600 }}>
              Kanchi Cafe — auto-marked as credit customer
            </div>
          )}
          <Row>
            <Field label="Phone"   value={form.phone}   onChange={v => setField('phone', v)}/>
            <Field label="Address" value={form.address} onChange={v => setField('address', v)}/>
          </Row>
          <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:'10px 12px', background:'var(--bg)', borderRadius:8, border:'1px solid var(--border)' }}>
            <input
              type="checkbox"
              checked={Boolean(form.credit)}
              onChange={e => setField('credit', e.target.checked as unknown as string)}
              style={{ width:16, height:16, accentColor:'var(--accent)' }}
            />
            <span style={{ fontSize:13.5, fontWeight:600, color:'var(--ink2)' }}>Credit customer</span>
          </label>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:4 }}>
            <Btn variant="ghost" onClick={closeAdd}>Cancel</Btn>
            <Btn onClick={addCustomer}>Add Customer</Btn>
          </div>
        </Modal>
      )}

      {/* Collect payment modal */}
      {payModal && (
        <Modal title={`Collect — ${payModal.name}`} onClose={closeCollect} width={420}>
          <div style={{ display:'flex', justifyContent:'space-between', padding:'14px 16px', background:'var(--redbg)', border:'1px solid var(--redbd)', borderRadius:9 }}>
            <span style={{ fontSize:13, color:'var(--ink3)', fontWeight:600 }}>Outstanding</span>
            <span style={{ fontSize:20, fontWeight:800, color:'var(--red)' }}>₹{payModal.outstanding.toLocaleString()}</span>
          </div>
          <Field label="Amount Collected (₹)" type="number" value={payAmt} onChange={setPayAmt}/>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <Btn variant="ghost" onClick={closeCollect}>Cancel</Btn>
            <Btn variant="success" onClick={recordPayment}>✓ Record</Btn>
          </div>
        </Modal>
      )}
    </Page>
  );
};
