# Deposit Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Track deposit amounts on item prices, auto-record deposits on bill lines, show deposit stats in billing summary and reports, and allow Admin to settle deposits (deducting from bank).

**Architecture:** Add `deposit` field to `item_prices` and `bill_lines` tables. Add `deposit_settlements` table. Billing auto-sets deposit from item price config. Reports show deposit breakdown and settlement tracking. Settlement creates a `DEPOSIT_SETTLEMENT` transaction deducting from bank.

**Tech Stack:** Supabase (PostgreSQL), React, TypeScript, Zustand

---

### Task 1: Database Migration

**Files:**
- Create: `db/migrations/20260411_002_deposit_tracking.sql`
- Modify: `src/erp/core/supabase.ts` (add migration to MIGRATIONS array)

- [ ] **Step 1: Create the migration SQL file**

```sql
-- 20260411_002_deposit_tracking.sql
-- Adds deposit tracking: deposit field on item_prices and bill_lines,
-- deposit_settlements table, DEPOSIT_SETTLEMENT transaction type.

-- 1. Add deposit column to item_prices
ALTER TABLE public.item_prices
  ADD COLUMN IF NOT EXISTS deposit numeric NOT NULL DEFAULT 0;

-- 2. Add deposit column to bill_lines
ALTER TABLE public.bill_lines
  ADD COLUMN IF NOT EXISTS deposit numeric NOT NULL DEFAULT 0;

-- 3. Create deposit_settlements table
CREATE TABLE IF NOT EXISTS public.deposit_settlements (
  id          bigserial    PRIMARY KEY,
  date        text         NOT NULL,
  amount      numeric      NOT NULL CHECK (amount > 0),
  note        text         NOT NULL DEFAULT '',
  created_at  timestamptz  NOT NULL DEFAULT now(),
  created_by  text         NOT NULL DEFAULT ''
);

-- 4. RLS for deposit_settlements
ALTER TABLE public.deposit_settlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all" ON public.deposit_settlements;
CREATE POLICY "anon_all" ON public.deposit_settlements
  FOR ALL TO anon USING (true) WITH CHECK (true);
```

- [ ] **Step 2: Register the migration in supabase.ts**

In `src/erp/core/supabase.ts`, add the import and migration entry:

```ts
import migration002 from '../../../db/migrations/20260411_002_deposit_tracking.sql?raw';
```

Add to the `MIGRATIONS` array:

```ts
{
  version: 2,
  name: '20260411_002_deposit_tracking',
  up: migration002,
},
```

- [ ] **Step 3: Verify build**

Run: `npx tsc -b --noEmit`
Expected: No errors.

---

### Task 2: Update TypeScript Types

**Files:**
- Modify: `src/erp/core/types.ts`

- [ ] **Step 1: Add `deposit` to `ItemPrice`**

```ts
export interface ItemPrice {
  id: string;        // bigserial as string
  price: number;
  deposit: number;   // deposit portion of this price (goes to company)
  sortOrder: number;
}
```

- [ ] **Step 2: Add `deposit` to `BillLine`**

```ts
export interface BillLine {
  itemId: string;
  itemName: string;
  qty: number;
  price: number;
  amount: number;
  deposit: number;   // deposit per unit, snapshotted from ItemPrice at bill time
}
```

- [ ] **Step 3: Add `DEPOSIT_SETTLEMENT` to `TxnType`**

```ts
export type TxnType =
  | 'CASH_TO_BANK'
  | 'BANK_TO_CASH'
  | 'EXPENSE_CASH'
  | 'EXPENSE_BANK'
  | 'ADD_TO_BANK'
  | 'ADD_TO_CASH'
  | 'DEPOSIT_SETTLEMENT';
```

- [ ] **Step 4: Add `DepositSettlement` type**

Add after the `Transaction` interface:

```ts
export interface DepositSettlement {
  id: string;
  date: string;
  amount: number;
  note: string;
  createdAt?: number;
  createdBy?: string;
}
```

---

### Task 3: Update Supabase Fetch/Sync Layer

**Files:**
- Modify: `src/erp/core/supabase.ts`

- [ ] **Step 1: Update `fetchAllItems` — add deposit to price mapping**

In the price grouping section, add `deposit` to the `ItemPrice` object:

```ts
pricesByItem[itemId].push({
  id: String(r.id),
  price: Number(r.price),
  deposit: Number(r.deposit ?? 0),
  sortOrder: Number(r.sort_order),
});
```

- [ ] **Step 2: Update `insertItem` — include deposit in price rows**

In the price insert section:

```ts
const priceRows = data.prices.map((p, idx) => ({
  item_id: Number(itemId),
  price: p.price,
  deposit: p.deposit ?? 0,
  sort_order: p.sortOrder ?? idx,
}));
```

- [ ] **Step 3: Update `syncItems` — include deposit in price rows**

In the price replace section:

```ts
item.prices.map((p, idx) => ({
  item_id: Number(item.id),
  price: p.price,
  deposit: p.deposit ?? 0,
  sort_order: p.sortOrder ?? idx,
}))
```

- [ ] **Step 4: Update `fetchBills` — add deposit to bill line mapping**

In the bill lines mapping:

```ts
return {
  itemId: line.item_id as string,
  itemName: line.item_name as string,
  qty: Number(line.qty),
  price: Number(line.price),
  amount: Number(line.amount),
  deposit: Number(line.deposit ?? 0),
};
```

- [ ] **Step 5: Update `syncBill` — include deposit in bill_lines insert**

In the bill lines insert:

```ts
bill.lines.map(l => ({
  bill_id: bill.id,
  item_id: l.itemId,
  item_name: l.itemName,
  qty: l.qty,
  price: l.price,
  amount: l.amount,
  deposit: l.deposit ?? 0,
  created_by: _currentUser,
  updated_by: _currentUser,
}))
```

- [ ] **Step 6: Update `syncBillUpdate` — include deposit in bill_lines insert**

Same as Step 5 but in the `syncBillUpdate` function's line insert section.

- [ ] **Step 7: Add `fetchDepositSettlements` and `syncDepositSettlement`**

Add at the end of the fetch section:

```ts
export const fetchDepositSettlements = async (): Promise<DepositSettlement[]> => {
  const { data, error } = await supabase
    .from('deposit_settlements')
    .select('*')
    .order('date', { ascending: false });
  if (error) { console.warn('[Supabase] fetchDepositSettlements:', error); return []; }
  return (data ?? []).map(r => ({
    id: String(r.id),
    date: r.date as string,
    amount: Number(r.amount),
    note: (r.note ?? '') as string,
    createdAt: ts(r.created_at),
    createdBy: (r.created_by as string) || undefined,
  }));
};
```

Add at the end of the sync section:

```ts
export const syncDepositSettlement = (s: DepositSettlement) => {
  bg('insert deposit_settlement', supabase.from('deposit_settlements').insert({
    date: s.date,
    amount: s.amount,
    note: s.note,
    created_by: _currentUser,
  }));
};
```

- [ ] **Step 8: Add import for DepositSettlement type**

Add `DepositSettlement` to the type import from `./types`.

---

### Task 4: Update Billing Logic

**Files:**
- Modify: `src/erp/features/billing/useBilling.ts`

- [ ] **Step 1: Update `lines` derivation to include deposit**

Replace the lines memo to include `deposit` from the price entry:

```ts
const lines = useMemo(
  (): BillLine[] =>
    activeItems.flatMap(i =>
      i.prices
        .filter(p => +(qtys[`${i.id}-${p.id}`]?.qty || 0) > 0)
        .map(p => ({
          itemId: i.id,
          itemName: i.name,
          qty: +(qtys[`${i.id}-${p.id}`].qty),
          price: p.price,
          amount: +(qtys[`${i.id}-${p.id}`].qty) * p.price,
          deposit: p.deposit,
        }))
    ),
  [qtys, activeItems]
);
```

- [ ] **Step 2: Add deposit stats to monthSummary**

Update the `monthSummary` memo to include deposit totals:

```ts
const monthSummary = useMemo(
  () => ({
    count: monthBills.length,
    cash: monthBills
      .filter(b => b.payment === 'Cash')
      .reduce((s, b) => s + b.total, 0),
    upi: monthBills
      .filter(b => b.payment === 'UPI')
      .reduce((s, b) => s + b.total, 0),
    credit: monthBills
      .filter(b => b.payment === 'Credit')
      .reduce((s, b) => s + b.total, 0),
    totalDeposits: monthBills.reduce(
      (s, b) => s + b.lines.reduce((ls, l) => ls + l.qty * l.deposit, 0),
      0
    ),
    netRevenue: monthBills.reduce(
      (s, b) => s + b.total - b.lines.reduce((ls, l) => ls + l.qty * l.deposit, 0),
      0
    ),
  }),
  [monthBills]
);
```

---

### Task 5: Update Billing UI — Deposit Label

**Files:**
- Modify: `src/erp/features/billing/BillingPage.tsx`

- [ ] **Step 1: Show deposit label on item rows with deposit > 0**

In the billing form item rows, find the stock display section (the `isFirstPrice` block). Add deposit info:

```tsx
{isFirstPrice && (
  <div
    style={{
      fontSize: 11,
      marginTop: 3,
      fontWeight: 600,
      color: 'var(--green)',
    }}
  >
    {avail} {item.itemType === 'linked' ? 'available' : 'in stock'}
    {priceEntry.deposit > 0 && (
      <span style={{ color: 'var(--amber)', marginLeft: 6 }}>
        · Deposit: ₹{priceEntry.deposit.toLocaleString()}
      </span>
    )}
  </div>
)}
{!isFirstPrice && (
  <div
    style={{
      fontSize: 11,
      marginTop: 3,
      color: 'var(--ink3)',
      fontStyle: 'italic',
    }}
  >
    alt price
    {priceEntry.deposit > 0 && (
      <span style={{ color: 'var(--amber)', marginLeft: 6 }}>
        · Deposit: ₹{priceEntry.deposit.toLocaleString()}
      </span>
    )}
  </div>
)}
```

- [ ] **Step 2: Add deposit stats to billing summary cards**

Find the billing summary stat cards section and add "Total Deposits" and "Net Revenue" cards:

```tsx
{ label: 'Total Deposits', value: `₹${monthSummary.totalDeposits.toLocaleString()}`, sub: 'to company', color: 'var(--amber)' },
{ label: 'Net Revenue', value: `₹${monthSummary.netRevenue.toLocaleString()}`, sub: 'agency revenue', color: 'var(--green)' },
```

---

### Task 6: Update Item Master — Deposit Input

**Files:**
- Modify: `src/erp/features/items/useItems.ts`
- Modify: `src/erp/features/items/ItemMasterPage.tsx`

- [ ] **Step 1: Update AddForm to include deposit per price**

Change `prices: string[]` to `prices: { price: string; deposit: string }[]`:

```ts
interface AddForm {
  name: string;
  unit: string;
  prices: { price: string; deposit: string }[];
  itemType: ItemType;
}

const EMPTY_FORM: AddForm = {
  name: '',
  unit: 'Piece',
  prices: [{ price: '0', deposit: '0' }],
  itemType: 'regular',
};
```

- [ ] **Step 2: Update `addItem` to parse deposit**

In the `addItem` function, update the price parsing:

```ts
const parsedPrices = form.prices
  .map(p => ({
    price: parseFloat(p.price),
    deposit: parseFloat(p.deposit) || 0,
  }))
  .filter(p => !isNaN(p.price) && p.price >= 0);
```

And when creating the item:

```ts
prices: parsedPrices.map((p, idx) => ({
  id: `temp-${idx}`,
  price: p.price,
  deposit: p.deposit,
  sortOrder: idx,
})),
```

- [ ] **Step 3: Update ItemMasterPage price editing to include deposit**

In the multi-price editor, add a deposit input next to each price input:

```tsx
<div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
  <span style={{ fontSize: 11, color: 'var(--ink3)', width: 20 }}>{idx + 1}.</span>
  <input
    type="number"
    placeholder="Price"
    value={/* price value */}
    onChange={/* price handler */}
    style={/* existing price input style */}
  />
  <input
    type="number"
    placeholder="Deposit"
    value={/* deposit value */}
    onChange={e => {
      const val = parseFloat(e.target.value) || 0;
      savePrices(item.id, item.prices.map(pp =>
        pp.id === p.id ? { ...pp, deposit: val } : pp
      ));
    }}
    style={{
      width: 80, padding: '6px 10px', background: 'var(--bg)',
      border: '1px solid var(--border2)', borderRadius: 6,
      fontSize: 13, fontFamily: "'JetBrains Mono',monospace",
      fontWeight: 600, color: 'var(--amber)', outline: 'none',
    }}
  />
  {/* existing remove button */}
</div>
```

- [ ] **Step 4: Update add item form prices to include deposit**

Each price row in the add form gets a deposit field:

```tsx
{addForm.prices.map((p, idx) => (
  <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'center' }}>
    <input
      type="number"
      placeholder="Price"
      value={p.price}
      onChange={e => {
        const newPrices = [...addForm.prices];
        newPrices[idx] = { ...newPrices[idx], price: e.target.value };
        setAddForm(f => ({ ...f, prices: newPrices }));
      }}
      style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 13, outline: 'none' }}
    />
    <input
      type="number"
      placeholder="Deposit"
      value={p.deposit}
      onChange={e => {
        const newPrices = [...addForm.prices];
        newPrices[idx] = { ...newPrices[idx], deposit: e.target.value };
        setAddForm(f => ({ ...f, prices: newPrices }));
      }}
      style={{ width: 80, padding: '8px 12px', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 13, outline: 'none', color: 'var(--amber)' }}
    />
    {addForm.prices.length > 1 && (
      <button onClick={() => setAddForm(f => ({ ...f, prices: f.prices.filter((_, i) => i !== idx) }))}
        style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 16 }}>×</button>
    )}
  </div>
))}
<button
  onClick={() => setAddForm(f => ({ ...f, prices: [...f.prices, { price: '', deposit: '0' }] }))}
  style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, marginTop: 2 }}
>+ Add another price</button>
```

---

### Task 7: Deposits Report & Settlement

**Files:**
- Modify: `src/erp/features/reports/useReports.ts`
- Modify: `src/erp/features/reports/ReportsPage.tsx`
- Modify: `src/erp/core/store.ts` (add depositSettlements slice)
- Modify: `src/erp/App.tsx` (fetch settlements on bootstrap)

- [ ] **Step 1: Add depositSettlements to store**

In `src/erp/core/store.ts`, add to the state and actions:

```ts
depositSettlements: DepositSettlement[];
setDepositSettlements: (fn: DepositSettlement[] | ((p: DepositSettlement[]) => DepositSettlement[])) => void;
```

- [ ] **Step 2: Fetch settlements on bootstrap**

In `src/erp/App.tsx`, import `fetchDepositSettlements` and add to the bootstrap:

```ts
import { fetchDepositSettlements } from './core/supabase';
```

In `doBootstrap`, after loading transactions:

```ts
const settlements = await fetchDepositSettlements();
if (settlements.length) setDepositSettlements(settlements);
```

- [ ] **Step 3: Add "Deposits" tab to TABS**

In `useReports.ts`:

```ts
export const TABS = [
  { id: 'overview', l: 'P&L Overview' },
  { id: 'daily', l: 'Sales Report' },
  { id: 'credit', l: 'Credit Report' },
  { id: 'purchase', l: 'Purchases' },
  { id: 'deposits', l: 'Deposits' },
] as const;
```

- [ ] **Step 4: Add deposit report data to useReports**

Add to `useReports.ts`:

```ts
const { depositSettlements, setDepositSettlements, transactions, setTransactions } = useERPStore(
  useShallow(s => ({
    // ... existing fields ...
    depositSettlements: s.depositSettlements,
    setDepositSettlements: s.setDepositSettlements,
    transactions: s.transactions,
    setTransactions: s.setTransactions,
  }))
);

// Deposit stats
const depositStats = useMemo(() => {
  const totalCollected = bills.reduce(
    (s, b) => s + b.lines.reduce((ls, l) => ls + l.qty * l.deposit, 0),
    0
  );
  const totalSettled = depositSettlements.reduce((s, d) => s + d.amount, 0);
  return {
    totalCollected,
    totalSettled,
    unsettled: totalCollected - totalSettled,
  };
}, [bills, depositSettlements]);

// Deposits by item (for selected month or all time)
const depositsByItem = useMemo(() => {
  const map: Record<string, { name: string; qty: number; depositPerUnit: number; totalDeposit: number }> = {};
  bills.forEach(b => {
    b.lines.forEach(l => {
      if (l.deposit <= 0) return;
      const key = `${l.itemId}-${l.deposit}`;
      if (!map[key]) map[key] = { name: l.itemName, qty: 0, depositPerUnit: l.deposit, totalDeposit: 0 };
      map[key].qty += l.qty;
      map[key].totalDeposit += l.qty * l.deposit;
    });
  });
  return Object.values(map).sort((a, b) => b.totalDeposit - a.totalDeposit);
}, [bills]);

// Settle deposits function
const settleDeposits = useCallback((amount: number, date: string, note: string) => {
  if (amount <= 0) {
    showToast('Enter a valid amount', 'error');
    return;
  }

  const settlement: DepositSettlement = {
    id: `DS-${Date.now()}`,
    date,
    amount,
    note,
    createdBy: JSON.parse(sessionStorage.getItem('gas-erp-user') ?? '{}')?.u ?? '',
  };

  // 1. Record settlement
  setDepositSettlements(prev => [settlement, ...prev]);
  syncDepositSettlement(settlement);

  // 2. Create bank deduction transaction
  const txn: Transaction = {
    id: `TXN-${Date.now()}`,
    date,
    type: 'DEPOSIT_SETTLEMENT',
    amount,
    note: note || 'Deposit settlement to company',
  };
  setTransactions(prev => [txn, ...prev]);
  syncTransaction(txn);

  showToast(`✓ Settled ₹${amount.toLocaleString()} from bank`, 'success');
}, [setDepositSettlements, setTransactions, showToast]);
```

Return `depositStats`, `depositsByItem`, `depositSettlements`, and `settleDeposits` from the hook.

- [ ] **Step 5: Add Deposits tab UI to ReportsPage**

Add a deposits tab section in `ReportsPage.tsx`:

```tsx
{tab === 'deposits' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    {/* Summary cards */}
    <div className="erp-grid-3">
      {[
        { label: 'Total Collected', value: `₹${depositStats.totalCollected.toLocaleString()}`, color: 'var(--accent)' },
        { label: 'Total Settled', value: `₹${depositStats.totalSettled.toLocaleString()}`, color: 'var(--green)' },
        { label: 'Unsettled Balance', value: `₹${depositStats.unsettled.toLocaleString()}`, color: depositStats.unsettled > 0 ? 'var(--red)' : 'var(--green)' },
      ].map(s => (
        <div key={s.label} style={{ background: 'var(--canvas)', border: '1px solid var(--border)', borderTop: `3px solid ${s.color}`, borderRadius: 12, padding: '20px 22px', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>{s.label}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--ink)', fontFamily: "'JetBrains Mono',monospace" }}>{s.value}</div>
        </div>
      ))}
    </div>

    {/* Deposits by item table */}
    <div style={{ background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'var(--sidebar)' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Deposits by Item</div>
      </div>
      {/* Table header + rows for depositsByItem */}
      {/* Columns: Item | Qty Sold | Deposit/Unit | Total Deposit */}
    </div>

    {/* Settle button (Admin only) */}
    {/* Settlement history table from depositSettlements */}
  </div>
)}
```

The settle form should include: amount input, date input, note input, and a "Settle from Bank" button that calls `settleDeposits(amount, date, note)`.

The settlement history table shows: Date | Amount | Note | Settled By.

- [ ] **Step 6: Update P&L monthly data to include deposits**

In `useReports.ts` `monthlyData`, add deposit calculations:

```ts
const totalDeposits = mBills.reduce(
  (s, b) => s + b.lines.reduce((ls, l) => ls + l.qty * l.deposit, 0),
  0
);
const netRevenue = total - totalDeposits;
```

Add `totalDeposits` and `netRevenue` to the returned monthly data object.

---

### Task 8: Update Accounts — DEPOSIT_SETTLEMENT in Bank Balance

**Files:**
- Modify: `src/erp/features/accounts/` (if bank balance calculation references TxnType)
- Modify: `src/erp/features/reports/useReports.ts` (P&L bank closing balance)

- [ ] **Step 1: Update bank closing balance calculation**

In `useReports.ts` `monthlyData`, the `bankCB` calculation needs to include deposit settlements:

```ts
const depositSettled = mTxns
  .filter(t => t.type === 'DEPOSIT_SETTLEMENT')
  .reduce((s, t) => s + t.amount, 0);
const bankCB = ob.bank + upiSales + cashToBank + addToBank - bankToCash - expBank - depositSettled;
```

Also update `totalExpenses` to not include deposit settlements (they're a separate category):

```ts
const totalExpenses = expCash + expBank; // DEPOSIT_SETTLEMENT is not an expense — it's a deposit payout
```

- [ ] **Step 2: Update accounts page if it shows transactions by type**

Search the accounts feature for any TxnType switch/display and add handling for `DEPOSIT_SETTLEMENT`:
- Display label: "Deposit Settlement"
- Effect: deducts from bank
- Same as EXPENSE_BANK in terms of bank impact

---

### Task 9: Full Build Verification

**Files:** None (verification only)

- [ ] **Step 1: TypeScript check**

Run: `npx tsc -b --noEmit`
Expected: No errors.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Manual test checklist**

1. Item Master: edit item → add deposit amount to a price → verify it saves
2. Billing: bill an item with deposit → verify bill line has deposit recorded
3. Billing summary: verify "Total Deposits" and "Net Revenue" cards show correct values
4. Reports → Deposits tab: verify summary cards, deposits by item table
5. Reports → Deposits: settle ₹X → verify bank transaction created, unsettled balance decreases
6. Reports → P&L: verify bank closing balance accounts for deposit settlements
