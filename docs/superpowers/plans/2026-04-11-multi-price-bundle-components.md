# Multi-Price Items & Bundle Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow items to have multiple prices (each shown as a separate billing row) and linked items to deduct stock from multiple configurable component items.

**Architecture:** Two new DB tables (`item_prices`, `bundle_components`) replace the single `price` column and `stock_source_id` column on `items`. The billing form expands each item into N rows (one per price). Linked items auto-deduct component stock when billed.

**Tech Stack:** Supabase (PostgreSQL), React, TypeScript, Zustand

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/008_multi_price_bundle.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- 008_multi_price_bundle.sql
-- Multi-price items + bundle components

BEGIN;

-- 1. Create item_prices table
CREATE TABLE IF NOT EXISTS item_prices (
  id         bigserial    PRIMARY KEY,
  item_id    bigint       NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
  price      numeric      NOT NULL CHECK (price >= 0),
  sort_order int          NOT NULL DEFAULT 0,
  created_at timestamptz  NOT NULL DEFAULT now(),
  updated_at timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX idx_item_prices_item_sort ON item_prices (item_id, sort_order);

-- 2. Seed item_prices from existing items.price
INSERT INTO item_prices (item_id, price, sort_order)
SELECT item_id, price, 0 FROM items;

-- 3. Create bundle_components table
CREATE TABLE IF NOT EXISTS bundle_components (
  id                 bigserial    PRIMARY KEY,
  bundle_item_id     bigint       NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
  component_item_id  bigint       NOT NULL REFERENCES items(item_id) ON DELETE RESTRICT,
  qty                numeric      NOT NULL CHECK (qty > 0),
  created_at         timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (bundle_item_id, component_item_id)
);

-- 4. Seed bundle_components from existing stock_source_id
INSERT INTO bundle_components (bundle_item_id, component_item_id, qty)
SELECT item_id, stock_source_id, 1
FROM items
WHERE stock_source_id IS NOT NULL;

-- 5. Drop old columns
ALTER TABLE items DROP COLUMN IF EXISTS price;
ALTER TABLE items DROP COLUMN IF EXISTS stock_source_id;

COMMIT;
```

- [ ] **Step 2: Run migration against Supabase**

Run the SQL in the Supabase SQL editor or via CLI. Verify:
- `item_prices` has one row per item (same count as `items`)
- `bundle_components` has one row per linked item that had a `stock_source_id`
- `items` table no longer has `price` or `stock_source_id` columns

- [ ] **Step 3: Commit**

```bash
git add supabase/008_multi_price_bundle.sql
git commit -m "feat: add item_prices and bundle_components tables"
```

---

### Task 2: Update TypeScript Types

**Files:**
- Modify: `src/erp/core/types.ts`

- [ ] **Step 1: Add ItemPrice and BundleComponent types, update Item**

In `src/erp/core/types.ts`, replace the `Item` interface (lines 45-58) and add new types before it:

```ts
// ── Item Prices ────────────────────────────────────────────
export interface ItemPrice {
  id: string;        // bigserial as string
  price: number;
  sortOrder: number;
}

// ── Bundle Components (for linked items) ───────────────────
export interface BundleComponent {
  id: string;              // bigserial as string
  componentItemId: string; // bigserial as string
  componentItemName: string; // denormalized for display
  qty: number;
}

// ── Item Master ──────────────────────────────────────────────
export interface Item {
  id: string;           // bigserial as string (maps to item_id in DB)
  name: string;
  unit: string;
  prices: ItemPrice[];           // replaces single `price`
  active: boolean;
  itemType: ItemType;
  bundleComponents: BundleComponent[]; // replaces `stockSourceId`
  // audit
  createdAt?: number;
  updatedAt?: number;
  createdBy?: string;
  updatedBy?: string;
}
```

- [ ] **Step 2: Verify build compiles (expect errors in dependent files)**

Run: `npx tsc -b --noEmit 2>&1 | head -40`

Expected: Compilation errors in `supabase.ts`, `useBilling.ts`, `useItems.ts`, `BillingPage.tsx`, `usePurchase.ts`, `ItemMasterPage.tsx` referencing removed `price` and `stockSourceId` fields. This is correct — we'll fix them in subsequent tasks.

- [ ] **Step 3: Commit**

```bash
git add src/erp/core/types.ts
git commit -m "feat: add ItemPrice and BundleComponent types, update Item"
```

---

### Task 3: Update Supabase Fetch Layer

**Files:**
- Modify: `src/erp/core/supabase.ts`

- [ ] **Step 1: Update fetchAllItems to join item_prices and bundle_components**

Replace the `fetchAllItems` function (around lines 55-74) with:

```ts
export const fetchAllItems = async (): Promise<Item[]> => {
  // 1. Fetch items
  const { data: itemRows, error: itemErr } = await supabase
    .from('items')
    .select('*')
    .order('item_id', { ascending: true });
  if (itemErr) throw itemErr;
  if (!itemRows) return [];

  // 2. Fetch all prices
  const { data: priceRows, error: priceErr } = await supabase
    .from('item_prices')
    .select('*')
    .order('sort_order', { ascending: true });
  if (priceErr) throw priceErr;

  // 3. Fetch all bundle components
  const { data: bundleRows, error: bundleErr } = await supabase
    .from('bundle_components')
    .select('*');
  if (bundleErr) throw bundleErr;

  // 4. Build a name lookup for component items
  const nameMap: Record<string, string> = {};
  itemRows.forEach((r: Record<string, unknown>) => {
    nameMap[String(r.item_id)] = String(r.name);
  });

  // 5. Group prices by item_id
  const pricesByItem: Record<string, ItemPrice[]> = {};
  (priceRows ?? []).forEach((r: Record<string, unknown>) => {
    const itemId = String(r.item_id);
    if (!pricesByItem[itemId]) pricesByItem[itemId] = [];
    pricesByItem[itemId].push({
      id: String(r.id),
      price: Number(r.price),
      sortOrder: Number(r.sort_order),
    });
  });

  // 6. Group bundle components by bundle_item_id
  const componentsByBundle: Record<string, BundleComponent[]> = {};
  (bundleRows ?? []).forEach((r: Record<string, unknown>) => {
    const bundleId = String(r.bundle_item_id);
    if (!componentsByBundle[bundleId]) componentsByBundle[bundleId] = [];
    componentsByBundle[bundleId].push({
      id: String(r.id),
      componentItemId: String(r.component_item_id),
      componentItemName: nameMap[String(r.component_item_id)] ?? 'Unknown',
      qty: Number(r.qty),
    });
  });

  // 7. Assemble items
  return itemRows.map((r: Record<string, unknown>) => {
    const id = String(r.item_id);
    return {
      id,
      name: String(r.name),
      unit: String(r.unit ?? ''),
      prices: pricesByItem[id] ?? [],
      active: Boolean(r.active),
      itemType: (r.item_type as ItemType) ?? 'regular',
      bundleComponents: componentsByBundle[id] ?? [],
      createdAt: r.created_at ? new Date(r.created_at as string).getTime() : undefined,
      updatedAt: r.updated_at ? new Date(r.updated_at as string).getTime() : undefined,
      createdBy: r.created_by ? String(r.created_by) : undefined,
      updatedBy: r.updated_by ? String(r.updated_by) : undefined,
    };
  });
};
```

- [ ] **Step 2: Update insertItem to insert prices and bundle components**

Replace the `insertItem` function (around lines 295-312) with:

```ts
export const insertItem = async (
  item: Item,
  user: string
): Promise<void> => {
  // 1. Insert item row (without price and stock_source_id)
  const { error: itemErr } = await supabase.from('items').insert({
    item_id: Number(item.id),
    name: item.name,
    unit: item.unit,
    active: item.active,
    item_type: item.itemType,
    created_by: user,
    updated_by: user,
  });
  if (itemErr) throw itemErr;

  // 2. Insert prices
  if (item.prices.length > 0) {
    const priceRows = item.prices.map((p, idx) => ({
      item_id: Number(item.id),
      price: p.price,
      sort_order: p.sortOrder ?? idx,
    }));
    const { error: priceErr } = await supabase.from('item_prices').insert(priceRows);
    if (priceErr) throw priceErr;
  }

  // 3. Insert bundle components (only for linked items)
  if (item.bundleComponents.length > 0) {
    const compRows = item.bundleComponents.map(c => ({
      bundle_item_id: Number(item.id),
      component_item_id: Number(c.componentItemId),
      qty: c.qty,
    }));
    const { error: compErr } = await supabase.from('bundle_components').insert(compRows);
    if (compErr) throw compErr;
  }
};
```

- [ ] **Step 3: Update syncItems to sync prices and bundle components**

Replace `syncItems` (around lines 513-530) with:

```ts
export const syncItems = async (items: Item[]): Promise<void> => {
  for (const item of items) {
    // 1. Upsert item row
    await supabase.from('items').upsert({
      item_id: Number(item.id),
      name: item.name,
      unit: item.unit,
      active: item.active,
      item_type: item.itemType,
      updated_at: new Date().toISOString(),
      updated_by: item.updatedBy ?? null,
    }, { onConflict: 'item_id' });

    // 2. Replace prices: delete old, insert new
    await supabase.from('item_prices').delete().eq('item_id', Number(item.id));
    if (item.prices.length > 0) {
      await supabase.from('item_prices').insert(
        item.prices.map((p, idx) => ({
          item_id: Number(item.id),
          price: p.price,
          sort_order: p.sortOrder ?? idx,
        }))
      );
    }

    // 3. Replace bundle components: delete old, insert new
    await supabase.from('bundle_components').delete().eq('bundle_item_id', Number(item.id));
    if (item.bundleComponents.length > 0) {
      await supabase.from('bundle_components').insert(
        item.bundleComponents.map(c => ({
          bundle_item_id: Number(item.id),
          component_item_id: Number(c.componentItemId),
          qty: c.qty,
        }))
      );
    }
  }
};
```

- [ ] **Step 4: Commit**

```bash
git add src/erp/core/supabase.ts
git commit -m "feat: update supabase layer for multi-price and bundle components"
```

---

### Task 4: Update Billing Logic

**Files:**
- Modify: `src/erp/features/billing/useBilling.ts`

- [ ] **Step 1: Update RowsMap and makeEmptyQtys**

Change the `QtysMap` type (line 9) and `makeEmptyQtys` (lines 63-69):

```ts
// Key is now `${itemId}-${priceId}` for multi-price rows
type QtysMap = Record<string, { qty: string }>;
```

Update `makeEmptyQtys`:

```ts
const makeEmptyQtys = useCallback((): QtysMap => {
  const q: QtysMap = {};
  activeItems.forEach(i => {
    i.prices.forEach(p => {
      q[`${i.id}-${p.id}`] = { qty: '' };
    });
  });
  return q;
}, [activeItems]);
```

- [ ] **Step 2: Update activeItems filtering**

Replace the `activeItems` memo (lines 50-60):

```ts
const activeItems = useMemo(() => {
  return items.filter(i => {
    if (!i.active) return false;
    if (i.prices.length === 0) return false;
    if (i.itemType === 'linked') {
      // Show when ALL component items have enough stock for at least 1 bundle
      if (i.bundleComponents.length === 0) return false;
      return i.bundleComponents.every(
        c => (stock[c.componentItemId]?.qty ?? 0) >= c.qty
      );
    }
    return (stock[i.id]?.qty ?? 0) > 0;
  });
}, [items, stock]);
```

- [ ] **Step 3: Update lines derivation**

Replace the `lines` memo (around lines 73-85):

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
        }))
    ),
  [qtys, activeItems]
);
```

- [ ] **Step 4: Update stock validation in recordBill**

Replace the stock validation section (around lines 164-205):

```ts
// ── Stock validation — fully data-driven ─────────────────
// 1. Aggregate qty per item across all price rows
const qtyPerItem: Record<string, number> = {};
lines.forEach(l => {
  qtyPerItem[l.itemId] = (qtyPerItem[l.itemId] ?? 0) + l.qty;
});

// 2. Validate linked items — check all bundle components have enough stock
for (const [itemId, totalQty] of Object.entries(qtyPerItem)) {
  const item = items.find(i => i.id === itemId);
  if (item?.itemType !== 'linked') continue;
  for (const comp of item.bundleComponents) {
    const needed = totalQty * comp.qty;
    const available = stock[comp.componentItemId]?.qty ?? 0;
    // Also count any direct lines for the component item in this same bill
    const directQty = qtyPerItem[comp.componentItemId] ?? 0;
    if (needed + directQty > available) {
      const compName = comp.componentItemName;
      showToast(
        `Not enough ${compName} stock (need ${needed + directQty}, have ${available})`,
        'error'
      );
      return;
    }
  }
}

// 3. Validate own-stock items (regular + cylinder)
const overstock = Object.entries(qtyPerItem).filter(([itemId, totalQty]) => {
  const item = items.find(i => i.id === itemId);
  if (!item || item.itemType === 'linked') return false;
  return totalQty > (stock[itemId]?.qty ?? 0);
});
if (overstock.length) {
  const names = overstock
    .map(([id]) => items.find(i => i.id === id)?.name ?? id)
    .join(', ');
  showToast(`Insufficient stock for: ${names}`, 'error');
  return;
}
```

- [ ] **Step 5: Update stock deduction in recordBill**

Replace the stock deduction section (around lines 225-242):

```ts
// ── Stock deduction — data-driven ─────────────────────────
// 'linked' items deduct from their bundle components.
// All other items deduct from their own stock.
setStock(p => {
  const updated = { ...p };
  // Aggregate qty per item across all price rows
  const qtyPerItem: Record<string, number> = {};
  lines.forEach(l => {
    qtyPerItem[l.itemId] = (qtyPerItem[l.itemId] ?? 0) + l.qty;
  });

  for (const [itemId, totalQty] of Object.entries(qtyPerItem)) {
    const item = items.find(i => i.id === itemId);
    if (item?.itemType === 'linked') {
      // Deduct from each bundle component
      item.bundleComponents.forEach(comp => {
        const deductQty = totalQty * comp.qty;
        updated[comp.componentItemId] = {
          qty: Math.max(0, (updated[comp.componentItemId]?.qty ?? 0) - deductQty),
        };
      });
    } else {
      // Deduct from own stock
      updated[itemId] = {
        qty: Math.max(0, (updated[itemId]?.qty ?? 0) - totalQty),
      };
    }
  }
  syncStock(updated);
  return updated;
});
```

- [ ] **Step 6: Update setQtyField**

Replace the `setQtyField` callback (find the equivalent of `setRowField` in useBilling):

```ts
const setQtyField = useCallback(
  (key: string, v: string) =>
    setQtys(p => ({ ...p, [key]: { qty: v } })),
  []
);
```

- [ ] **Step 7: Update updateBill stock logic**

In `updateBill` (around lines 300-326), update the stock restore/deduct logic to handle bundles:

```ts
const updateBill = useCallback((oldBill: Bill, newBill: Bill) => {
  setBills(prev => prev.map(b => b.id === newBill.id ? newBill : b));

  setStock(prevStock => {
    const s = { ...prevStock };

    // Helper: aggregate qty per itemId from bill lines
    const aggregateQty = (billLines: BillLine[]): Record<string, number> => {
      const map: Record<string, number> = {};
      billLines.forEach(l => { map[l.itemId] = (map[l.itemId] ?? 0) + l.qty; });
      return map;
    };

    // Restore stock from old bill
    const oldQtyMap = aggregateQty(oldBill.lines);
    for (const [itemId, qty] of Object.entries(oldQtyMap)) {
      const item = items.find(i => i.id === itemId);
      if (item?.itemType === 'linked') {
        item.bundleComponents.forEach(comp => {
          const restoreQty = qty * comp.qty;
          s[comp.componentItemId] = { qty: (s[comp.componentItemId]?.qty ?? 0) + restoreQty };
        });
      } else {
        s[itemId] = { qty: (s[itemId]?.qty ?? 0) + qty };
      }
    }

    // Deduct stock for new bill
    const newQtyMap = aggregateQty(newBill.lines);
    for (const [itemId, qty] of Object.entries(newQtyMap)) {
      const item = items.find(i => i.id === itemId);
      if (item?.itemType === 'linked') {
        item.bundleComponents.forEach(comp => {
          const deductQty = qty * comp.qty;
          s[comp.componentItemId] = { qty: Math.max(0, (s[comp.componentItemId]?.qty ?? 0) - deductQty) };
        });
      } else {
        s[itemId] = { qty: Math.max(0, (s[itemId]?.qty ?? 0) - qty) };
      }
    }

    syncStock(s);
    return s;
  });

  syncBillUpdate(newBill);
  showToast(`✓ Bill ${newBill.id} updated`, 'success');
}, [setBills, setStock, items, showToast]);
```

- [ ] **Step 8: Commit**

```bash
git add src/erp/features/billing/useBilling.ts
git commit -m "feat: update billing logic for multi-price rows and bundle stock deduction"
```

---

### Task 5: Update Billing UI

**Files:**
- Modify: `src/erp/features/billing/BillingPage.tsx`

- [ ] **Step 1: Update item row rendering to expand prices**

Replace the item rows loop (around lines 1284-1396). Instead of iterating `activeItems` directly, expand each item into price rows:

```tsx
{activeItems.flatMap((item) => {
  const stockKey = item.itemType === 'linked'
    ? null  // bundles don't show own stock — show component availability
    : item.id;
  const avail = item.itemType === 'linked'
    ? Math.min(...item.bundleComponents.map(c =>
        Math.floor((stock[c.componentItemId]?.qty ?? 0) / c.qty)
      ))
    : (stock[item.id]?.qty ?? 0);

  return item.prices.map((priceEntry, priceIdx) => {
    const rowKey = `${item.id}-${priceEntry.id}`;
    const qty = +(qtys[rowKey]?.qty || 0);
    const tot = qty * priceEntry.price;
    const has = qty > 0;
    const isFirstPrice = priceIdx === 0;

    return (
      <div
        key={rowKey}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 90px 110px 100px',
          alignItems: 'center',
          borderBottom: '1px solid var(--border)',
          background: has ? '#f0fdf4' : 'var(--canvas)',
        }}
      >
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 3, height: 32, borderRadius: 99,
              background: has ? 'var(--green)' : 'var(--border)',
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: has ? 700 : 500 }}>
              {item.name}
            </div>
            {isFirstPrice && (
              <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 3 }}>
                {avail} {item.itemType === 'linked' ? 'available' : 'in stock'}
              </div>
            )}
            {!isFirstPrice && (
              <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 3, fontStyle: 'italic' }}>
                alt price
              </div>
            )}
          </div>
        </div>
        <div style={{ padding: '8px 10px' }}>
          <input
            type="number"
            min="0"
            placeholder="—"
            value={qtys[rowKey]?.qty || ''}
            onChange={e => setQtyField(rowKey, e.target.value)}
            style={{
              width: '100%', textAlign: 'center',
              background: has ? 'var(--canvas)' : 'var(--bg)',
              border: `2px solid ${has ? 'var(--green)' : 'var(--border)'}`,
              borderRadius: 8, padding: '8px 6px', fontSize: 15,
              fontWeight: 800, color: has ? 'var(--green)' : 'var(--ink3)',
              outline: 'none', fontFamily: "'JetBrains Mono',monospace",
            }}
          />
        </div>
        <div style={{ padding: '12px 16px', textAlign: 'right' }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontWeight: 600, fontSize: 13,
              color: 'var(--ink2)',
            }}
          >
            ₹{priceEntry.price.toLocaleString()}
          </span>
        </div>
        <div style={{ padding: '12px 16px', textAlign: 'right' }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontWeight: 800, fontSize: 14,
              color: has ? 'var(--green)' : 'var(--ink3)',
            }}
          >
            {has ? `₹${tot.toLocaleString()}` : '—'}
          </span>
        </div>
      </div>
    );
  });
})}
```

- [ ] **Step 2: Update the bill edit modal to handle multi-price lines**

In the `BillEditModal`, the edit lines already work with `BillLine[]` which stores `price` per line. No structural change needed — the modal edits existing bill lines which already have their price set. Just ensure the rate input in the edit modal is read-only or reflects the stored price.

- [ ] **Step 3: Verify build compiles**

Run: `npx tsc -b --noEmit 2>&1 | head -20`
Expected: No errors related to billing files.

- [ ] **Step 4: Commit**

```bash
git add src/erp/features/billing/BillingPage.tsx
git commit -m "feat: expand billing rows per price, rate read-only"
```

---

### Task 6: Update Item Master — Multi-Price UI

**Files:**
- Modify: `src/erp/features/items/useItems.ts`
- Modify: `src/erp/features/items/ItemMasterPage.tsx` (or equivalent items page)

- [ ] **Step 1: Update useItems — AddForm and price management**

In `useItems.ts`, update the `AddForm` interface (line 11-17) to support multiple prices:

```ts
interface AddForm {
  name: string;
  unit: string;
  prices: string[];   // array of price strings (replaces single `price: string`)
  itemType: ItemType;
}
```

Update the initial form state:

```ts
const [addForm, setAddForm] = useState<AddForm>({
  name: '', unit: '', prices: [''], itemType: 'regular',
});
```

- [ ] **Step 2: Update addItem to create item with prices array**

Replace the `addItem` function (around lines 245-290):

```ts
const addItem = useCallback(async () => {
  if (!addForm.name.trim()) {
    showToast('Name is required', 'error');
    return;
  }
  const parsedPrices = addForm.prices
    .map(p => parseFloat(p))
    .filter(p => !isNaN(p) && p >= 0);
  if (parsedPrices.length === 0) {
    showToast('At least one valid price is required', 'error');
    return;
  }

  // Get next ID
  const maxId = items.reduce((m, i) => Math.max(m, Number(i.id) || 0), 0);
  const newId = String(maxId + 1);

  const user = JSON.parse(sessionStorage.getItem('gas-erp-user') ?? '{}')?.u ?? '';

  const newItem: Item = {
    id: newId,
    name: addForm.name.trim(),
    unit: addForm.unit.trim() || 'nos',
    prices: parsedPrices.map((p, idx) => ({
      id: `temp-${idx}`,  // DB will assign real IDs
      price: p,
      sortOrder: idx,
    })),
    active: true,
    itemType: addForm.itemType,
    bundleComponents: [],
    createdBy: user,
    updatedBy: user,
  };

  setItems(prev => [...prev, newItem]);
  setStock(prev => ({ ...prev, [newId]: { qty: 0 } }));

  try {
    await insertItem(newItem, user);
    await insertStockRow(newId);
    showToast(`✓ ${newItem.name} added`, 'success');
  } catch (err) {
    showToast('Failed to save item', 'error');
  }

  setAddForm({ name: '', unit: '', prices: [''], itemType: 'regular' });
}, [addForm, items, setItems, setStock, showToast]);
```

- [ ] **Step 3: Update savePrice to handle multiple prices**

Replace `savePrice` (around lines 110-121) with a function that saves the full prices array:

```ts
const savePrices = useCallback(
  (id: string, newPrices: ItemPrice[]) => {
    setItems(prev =>
      prev.map(i => (i.id === id ? { ...i, prices: newPrices } : i))
    );
    const item = items.find(i => i.id === id);
    if (item) {
      syncItems([{ ...item, prices: newPrices }]);
    }
  },
  [items, setItems]
);
```

- [ ] **Step 4: Add bundle component management functions**

Add to `useItems.ts`:

```ts
const saveBundleComponents = useCallback(
  (id: string, components: BundleComponent[]) => {
    setItems(prev =>
      prev.map(i => (i.id === id ? { ...i, bundleComponents: components } : i))
    );
    const item = items.find(i => i.id === id);
    if (item) {
      syncItems([{ ...item, bundleComponents: components }]);
    }
  },
  [items, setItems]
);
```

Return both `savePrices` and `saveBundleComponents` from the hook.

- [ ] **Step 5: Update ItemMasterPage — replace single price input with multi-price section**

In the item edit/detail UI, replace the single price input (around lines 117-213) with a prices list:

```tsx
{/* Prices section */}
<div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
    <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
      Prices
    </div>
    <button
      onClick={() => savePrices(item.id, [
        ...item.prices,
        { id: `new-${Date.now()}`, price: 0, sortOrder: item.prices.length },
      ])}
      style={{
        background: 'var(--bg)', border: '1px solid var(--border2)',
        borderRadius: 6, padding: '3px 8px', fontSize: 11,
        fontWeight: 600, color: 'var(--ink2)', cursor: 'pointer',
      }}
    >
      + Add Price
    </button>
  </div>
  {item.prices.map((p, idx) => (
    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{ fontSize: 11, color: 'var(--ink3)', width: 20 }}>{idx + 1}.</span>
      <input
        type="number"
        value={editingPriceId === p.id ? editingPriceVal : p.price}
        onFocus={() => { setEditingPriceId(p.id); setEditingPriceVal(String(p.price)); }}
        onChange={e => setEditingPriceVal(e.target.value)}
        onBlur={() => {
          const val = parseFloat(editingPriceVal);
          if (!isNaN(val) && val >= 0) {
            savePrices(item.id, item.prices.map(pp =>
              pp.id === p.id ? { ...pp, price: val } : pp
            ));
          }
          setEditingPriceId(null);
        }}
        style={{
          flex: 1, padding: '6px 10px', background: 'var(--bg)',
          border: '1px solid var(--border2)', borderRadius: 6,
          fontSize: 14, fontFamily: "'JetBrains Mono',monospace",
          fontWeight: 700, color: 'var(--ink)', outline: 'none',
        }}
      />
      {item.prices.length > 1 && (
        <button
          onClick={() => savePrices(item.id, item.prices.filter(pp => pp.id !== p.id))}
          style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 16 }}
        >
          ×
        </button>
      )}
    </div>
  ))}
</div>
```

- [ ] **Step 6: Add Bundle Components section for linked items**

Add below the prices section, only visible when `item.itemType === 'linked'`:

```tsx
{item.itemType === 'linked' && (
  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
          Bundle Components
        </div>
        <div style={{ fontSize: 10, color: 'var(--ink3)', marginTop: 2 }}>
          Stock deducted when this package is billed
        </div>
      </div>
      <button
        onClick={() => setShowComponentPicker(item.id)}
        style={{
          background: 'var(--bg)', border: '1px solid var(--border2)',
          borderRadius: 6, padding: '3px 8px', fontSize: 11,
          fontWeight: 600, color: 'var(--ink2)', cursor: 'pointer',
        }}
      >
        + Add Component
      </button>
    </div>
    {item.bundleComponents.map(comp => (
      <div key={comp.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, padding: '6px 0' }}>
        <div style={{ width: 3, height: 24, background: 'var(--green)', borderRadius: 99 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{comp.componentItemName}</div>
          <div style={{ fontSize: 10, color: 'var(--ink3)' }}>
            {stock[comp.componentItemId]?.qty ?? 0} in stock
          </div>
        </div>
        <input
          type="number"
          value={comp.qty}
          min="1"
          onChange={e => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val) && val > 0) {
              saveBundleComponents(item.id,
                item.bundleComponents.map(c =>
                  c.id === comp.id ? { ...c, qty: val } : c
                )
              );
            }
          }}
          style={{
            width: 60, textAlign: 'center', padding: '5px 8px',
            background: 'var(--bg)', border: '1px solid var(--border2)',
            borderRadius: 6, fontFamily: "'JetBrains Mono',monospace",
            fontWeight: 700, fontSize: 14,
          }}
        />
        <button
          onClick={() => saveBundleComponents(item.id,
            item.bundleComponents.filter(c => c.id !== comp.id)
          )}
          style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 16 }}
        >
          ×
        </button>
      </div>
    ))}
    {item.bundleComponents.length === 0 && (
      <div style={{ fontSize: 12, color: 'var(--ink3)', fontStyle: 'italic', padding: '8px 0' }}>
        No components configured. Add items that should be deducted from stock.
      </div>
    )}
  </div>
)}
```

- [ ] **Step 7: Add component picker (simple dropdown or modal)**

Add state and a simple inline picker that shows non-linked active items to choose from:

```tsx
const [showComponentPicker, setShowComponentPicker] = useState<string | null>(null);

// In the component picker section (when showComponentPicker === item.id):
{showComponentPicker === item.id && (
  <div style={{ padding: '8px 16px', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', marginBottom: 6 }}>Select component item:</div>
    {items
      .filter(i => i.active && i.itemType !== 'linked' && !item.bundleComponents.some(c => c.componentItemId === i.id))
      .map(candidate => (
        <button
          key={candidate.id}
          onClick={() => {
            saveBundleComponents(item.id, [
              ...item.bundleComponents,
              {
                id: `new-${Date.now()}`,
                componentItemId: candidate.id,
                componentItemName: candidate.name,
                qty: 1,
              },
            ]);
            setShowComponentPicker(null);
          }}
          style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '8px 12px', marginBottom: 4, background: 'var(--canvas)',
            border: '1px solid var(--border)', borderRadius: 6,
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}
        >
          {candidate.name} ({stock[candidate.id]?.qty ?? 0} in stock)
        </button>
      ))}
    <button
      onClick={() => setShowComponentPicker(null)}
      style={{ marginTop: 4, fontSize: 11, color: 'var(--ink3)', background: 'none', border: 'none', cursor: 'pointer' }}
    >
      Cancel
    </button>
  </div>
)}
```

- [ ] **Step 8: Update add item form to support multiple prices**

In the add item modal/form, replace the single price input with a multi-price form:

```tsx
<div>
  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase' }}>
    Prices
  </label>
  {addForm.prices.map((p, idx) => (
    <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'center' }}>
      <input
        type="number"
        placeholder="Price"
        value={p}
        onChange={e => {
          const newPrices = [...addForm.prices];
          newPrices[idx] = e.target.value;
          setAddForm(f => ({ ...f, prices: newPrices }));
        }}
        style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 13, outline: 'none' }}
      />
      {addForm.prices.length > 1 && (
        <button
          onClick={() => setAddForm(f => ({ ...f, prices: f.prices.filter((_, i) => i !== idx) }))}
          style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 16 }}
        >×</button>
      )}
    </div>
  ))}
  <button
    onClick={() => setAddForm(f => ({ ...f, prices: [...f.prices, ''] }))}
    style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, marginTop: 2 }}
  >
    + Add another price
  </button>
</div>
```

- [ ] **Step 9: Verify build compiles**

Run: `npx tsc -b --noEmit 2>&1 | head -20`
Expected: No errors.

- [ ] **Step 10: Commit**

```bash
git add src/erp/features/items/useItems.ts src/erp/features/items/ItemMasterPage.tsx
git commit -m "feat: multi-price editing and bundle components UI in Item Master"
```

---

### Task 7: Update Purchase Form (minor)

**Files:**
- Modify: `src/erp/features/purchase/usePurchase.ts`

- [ ] **Step 1: Update references from item.price to item.prices[0].price**

The purchase form rate field is user-editable (not defaulted from item price), so the only change needed is if there are any references to `item.price`. Search for them:

In `usePurchase.ts`, the `makeEmptyRows` (line 30-36) initializes rate as empty string — no reference to `item.price`. No change needed here.

Check if `PurchasePage.tsx` references `item.price` anywhere. If it does (e.g., as a placeholder), update to `item.prices[0]?.price ?? 0`.

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc -b --noEmit 2>&1 | head -20`
Expected: No errors.

- [ ] **Step 3: Commit (if changes were needed)**

```bash
git add src/erp/features/purchase/usePurchase.ts src/erp/features/purchase/PurchasePage.tsx
git commit -m "fix: update purchase form to use item.prices array"
```

---

### Task 8: Full Integration Test

**Files:** None (manual testing)

- [ ] **Step 1: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 2: Test multi-price in Item Master**

1. Open Item Master
2. Edit an existing item — verify it shows the migrated price
3. Click "+ Add Price" — add a second price
4. Save and verify both prices persist after page refresh

- [ ] **Step 3: Test bundle components in Item Master**

1. Edit a linked item (or create a new one with type "linked")
2. Add 2-3 component items with quantities
3. Save and verify components persist after refresh

- [ ] **Step 4: Test multi-price billing**

1. Go to Billing
2. Verify items with 2 prices show as 2 rows
3. Enter qty on different price rows for the same item
4. Record bill — verify stock is deducted correctly (sum of all qty across price rows)

- [ ] **Step 5: Test bundle billing**

1. Bill a linked item (new connection package)
2. Verify it shows as one line per price in billing form
3. Record bill — verify all component item stocks are deducted by the correct quantities
4. Check stock page to confirm deductions

- [ ] **Step 6: Test purchase form**

1. Verify purchase form still shows only regular/cylinder items
2. Verify rate is still editable
3. Record a purchase — verify stock increments correctly

- [ ] **Step 7: Commit final state**

```bash
git add -A
git commit -m "feat: multi-price items and bundle components complete"
```
