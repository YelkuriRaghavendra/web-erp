# Deposit Tracking

**Date:** 2026-04-11
**Status:** Approved

## Problem

Some items (e.g., New Connection, DBC) include a deposit amount that the agency collects from the customer but must forward to the company (HPCL). Currently there's no way to distinguish deposit money from agency revenue, or track whether deposits have been settled with the company.

## Design Decisions

| Decision | Choice |
|----------|--------|
| Which items support deposits | Admin marks specific items — any item type can have a deposit configured per price |
| Deposit amount at bill time | Auto-calculated from Admin config — billing user cannot override |
| Reports | Both: deposit stats in billing summary + separate deposits report page |
| Settlement tracking | Yes — settle deposits to company, always deducts from bank |
| Settlement payment mode | Always bank — no choice needed |

## Data Model

### Modify `item_prices` table

Add column:
- `deposit` numeric NOT NULL DEFAULT 0 — how much of this price is a deposit to the company

### Modify `bill_lines` table

Add column:
- `deposit` numeric NOT NULL DEFAULT 0 — stores the deposit amount for this line at bill time (snapshot from item price config)

### New table: `deposit_settlements`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | bigserial | PK |
| `date` | text | NOT NULL, YYYY-MM-DD |
| `amount` | numeric | NOT NULL, > 0 |
| `note` | text | NOT NULL DEFAULT '' |
| `created_at` | timestamptz | NOT NULL DEFAULT now() |
| `created_by` | text | NOT NULL DEFAULT '' |

### Modify `TxnType`

Add `DEPOSIT_SETTLEMENT` to the union type. When a settlement is recorded, a transaction of this type is created to deduct from bank.

## TypeScript Types

```ts
// Update ItemPrice
export interface ItemPrice {
  id: string;
  price: number;
  deposit: number;    // NEW — deposit portion of this price
  sortOrder: number;
}

// Update BillLine
export interface BillLine {
  itemId: string;
  itemName: string;
  qty: number;
  price: number;
  amount: number;
  deposit: number;    // NEW — deposit per unit, snapshotted from ItemPrice at bill time
}

// New type
export interface DepositSettlement {
  id: string;
  date: string;
  amount: number;
  note: string;
  createdAt?: number;
  createdBy?: string;
}
```

## Billing Flow

When `createBill` builds `BillLine[]`:
1. For each line, look up the item's price entry used
2. Set `BillLine.deposit = itemPrice.deposit` (the per-unit deposit)
3. Total deposit for the line = `qty * deposit`
4. No change to billing UI flow — user just enters qty as before

Bill line stored in DB:
- `price` = ₹2,200 (what customer pays per unit)
- `deposit` = ₹2,200 (what goes to company per unit)
- `amount` = qty * price = total customer pays
- Revenue per line = amount - (qty * deposit)

## Billing Summary (Monthly)

Add to existing monthly stats:
- **Total Deposits** — `sum of (line.qty * line.deposit)` across all bills in the month
- **Net Revenue** — `total billed - total deposits`

## Item Master UI

Each price row in the prices section gets a "Deposit ₹" input next to the price input:
```
Price: [₹2,200]  Deposit: [₹2,200]  [×]
Price: [₹1,800]  Deposit: [₹500]    [×]
[+ Add Price]
```

Default deposit is 0 (no deposit). Admin sets it per price.

## Billing UI

In the billing form item rows, when a price has `deposit > 0`, show a small label:
```
New Connection (Regular)
  2 available · Deposit: ₹2,200
```

This is informational only — no input needed from billing user.

## Deposits Report

New section in Reports (or a tab within reports page):

### Summary Cards
- **Total Deposits Collected** (all time or selected month)
- **Total Settled** (sum of all settlements)
- **Unsettled Balance** (collected - settled)

### Deposits by Item (monthly)
Table showing:
| Item | Qty Sold | Deposit/Unit | Total Deposit |
|------|----------|-------------|---------------|

### Settlement History
Table showing past settlements:
| Date | Amount | Note | Settled By |

### Settle Button (Admin only)
- "Settle Deposits" button
- Input: amount, date, optional note
- On submit:
  1. Create `deposit_settlements` record
  2. Create a `Transaction` of type `DEPOSIT_SETTLEMENT` with the amount (deducts from bank)
  3. Update opening balance / bank balance accordingly
- Same pattern as existing EXPENSE_BANK transactions

## Affected Files

| File | Change |
|------|--------|
| `db/migrations/` | New migration: add `deposit` to `item_prices` and `bill_lines`, create `deposit_settlements` table |
| `core/types.ts` | Add `deposit` to `ItemPrice` and `BillLine`; add `DepositSettlement`; add `DEPOSIT_SETTLEMENT` to `TxnType` |
| `core/supabase.ts` | Update fetch/sync for prices (deposit field), bill lines (deposit field); add fetch/sync for settlements |
| `core/store.ts` | Add `depositSettlements` slice if needed, or keep in reports |
| `features/billing/useBilling.ts` | Set `deposit` on bill lines from item price config |
| `features/billing/BillingPage.tsx` | Show deposit label on items with deposit > 0 |
| `features/billing/useBilling.ts` | Add deposit stats to monthly summary |
| `features/items/useItems.ts` | Handle deposit field in price management |
| `features/items/ItemMasterPage.tsx` | Add deposit input next to each price |
| `features/reports/` | Add deposits report section |
