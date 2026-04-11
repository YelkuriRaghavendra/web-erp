# Multi-Price Items & Bundle Components

**Date:** 2026-04-11
**Status:** Approved

## Problem

1. Items currently support only a single price. The business needs items to have multiple prices (e.g., different rates for the same cylinder). Each price should appear as a separate row in the billing form so the user enters qty against whichever price(s) they want.
2. Linked items (e.g., "New Connection") currently deduct stock from only one source item (`stockSourceId`). A new connection actually requires multiple component items (cylinder + regulator + pipe, etc.), each deducted from stock when the package is billed.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Multi-price model | Separate row per price in billing | User enters qty per price row; rate is read-only. Intuitive, no dropdowns needed. |
| Bundle stock deduction | Automatic/silent | Bundle shows as one line per price in billing. Component stock deducted in background. |
| Bundle configuration | In Item Master | "Bundle Components" section appears when editing a linked item. No separate page. |
| Package model | Multiple pre-configured bundles | Admin creates different linked items for different connection types (Domestic, Commercial). |
| Purchase form | Unchanged | Only regular/cylinder items appear. Bundles are a billing-only concept. Rate stays editable in purchase. |
| Data model approach | New relational tables | `item_prices` and `bundle_components` tables with FKs. Clean, queryable, referential integrity. |
| All item types support multi-price | Yes | Regular, cylinder, and linked items can all have multiple prices. |

## Database Schema

### New table: `item_prices`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | bigserial | PK |
| `item_id` | bigint | FK -> items(item_id) ON DELETE CASCADE, NOT NULL |
| `price` | numeric | NOT NULL, >= 0 |
| `sort_order` | int | NOT NULL, DEFAULT 0 |
| `created_at` | timestamptz | DEFAULT now() |
| `updated_at` | timestamptz | DEFAULT now() |

Index: `(item_id, sort_order)` for ordered fetch.

### New table: `bundle_components`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | bigserial | PK |
| `bundle_item_id` | bigint | FK -> items(item_id) ON DELETE CASCADE, NOT NULL |
| `component_item_id` | bigint | FK -> items(item_id) ON DELETE RESTRICT, NOT NULL |
| `qty` | numeric | NOT NULL, > 0 |
| `created_at` | timestamptz | DEFAULT now() |

Unique constraint: `(bundle_item_id, component_item_id)` — a component appears at most once per bundle.

`ON DELETE RESTRICT` on `component_item_id` prevents deleting an item that is used as a bundle component.

### Migration

1. Create `item_prices` table.
2. Seed from existing data: `INSERT INTO item_prices (item_id, price, sort_order) SELECT item_id, price, 0 FROM items`.
3. Create `bundle_components` table.
4. Seed from existing data: `INSERT INTO bundle_components (bundle_item_id, component_item_id, qty) SELECT item_id, stock_source_id, 1 FROM items WHERE stock_source_id IS NOT NULL`.
5. Drop `items.price` column.
6. Drop `items.stock_source_id` column.

## TypeScript Types

```ts
export interface ItemPrice {
  id: string;        // bigserial as string
  price: number;
  sortOrder: number;
}

export interface BundleComponent {
  id: string;              // bigserial as string
  componentItemId: string;
  componentItemName: string; // denormalized for display
  qty: number;
}

export interface Item {
  id: string;
  name: string;
  unit: string;
  prices: ItemPrice[];              // replaces single `price`
  active: boolean;
  itemType: ItemType;
  bundleComponents: BundleComponent[]; // replaces `stockSourceId`
  // audit fields unchanged
}
```

## Billing Form Changes

### Row expansion

Each item with N prices produces N rows in the billing form. The row key is `${itemId}-${priceId}`.

```ts
// RowsMap key changes from itemId to itemId-priceId
type RowsMap = Record<string, { qty: string }>;
// Rate is read-only from ItemPrice — not stored in RowsMap
```

### Active items logic

- **Regular/cylinder items**: show when their own stock > 0 (unchanged logic).
- **Linked items (bundles)**: show when ALL component items have enough stock for at least 1 bundle qty. Check: `for each component, stock[componentItemId].qty >= component.qty`.

### Stock validation (before recording bill)

1. **Regular/cylinder items**: sum qty across all price rows for the same item. Check total against available stock.
2. **Linked items (bundles)**: for each bundle, sum qty across all price rows. Multiply by each component's configured qty. Check each component's stock. Also account for direct lines billing the same component item in the same bill.

### Stock deduction (after recording bill)

1. **Regular/cylinder items**: deduct total qty (sum across price rows) from item's own stock.
2. **Linked items (bundles)**: for each bundle qty billed, deduct `bundle_qty * component.qty` from each component item's stock.

### Bill line structure

`BillLine` structure is unchanged: `{ itemId, itemName, qty, price, amount }`. Each price row that has qty > 0 becomes a separate `BillLine`. A single item can produce multiple bill lines (one per price with qty).

## Purchase Form

No changes. Only regular/cylinder items appear. Rate field remains editable (purchase prices vary by supplier). The existing `rows[item.id].rate` pattern stays.

## Item Master UI Changes

### Prices section (all item types)

- Replaces the single "Price" input field.
- Shows a list of prices with sort order.
- "+" Add Price" button appends a new row.
- Each row: price input + remove button.
- First price (sort_order = 0) is labeled "default" for reference.
- Minimum 1 price required — cannot remove the last one.

### Bundle Components section (linked items only)

- Visible only when `itemType === 'linked'`.
- Shows list of component items with qty.
- "+ Add Component" button opens a picker from active regular/cylinder items.
- Each row: item name + stock count + qty input + remove button.
- At least 1 component required for linked items.

### Creating a new item

- When item type is set to 'linked', the Bundle Components section appears.
- Price section available for all item types from the start.

## API Layer Changes (core/supabase.ts)

### Fetch

- `fetchItems()`: join `item_prices` and `bundle_components` to build `Item.prices[]` and `Item.bundleComponents[]`.
- Denormalize `componentItemName` by joining to items table.

### Sync

- `syncItem()`: upsert item row + upsert `item_prices` rows (delete removed, insert new, update existing) + upsert `bundle_components` rows.
- `syncBill()`: unchanged structure — bill lines already store price per line.
- `syncStock()`: unchanged — stock is a flat snapshot.

## Affected Files

| File | Change |
|------|--------|
| `core/types.ts` | Add `ItemPrice`, `BundleComponent`; update `Item` (remove `price`, `stockSourceId`; add `prices[]`, `bundleComponents[]`) |
| `core/supabase.ts` | Update `fetchItems` to join new tables; update item sync to handle prices + components |
| `core/store.ts` | No structural change — items array holds everything |
| `features/billing/useBilling.ts` | Expand items into price rows; update stock validation + deduction for bundles |
| `features/billing/BillingPage.tsx` | Row key = `itemId-priceId`; rate column read-only; rows grouped by item |
| `features/items/useItems.ts` | CRUD for prices + bundle components |
| `features/items/ItemsPage.tsx` | Add Prices section + Bundle Components section in edit/create form |
| `features/purchase/usePurchase.ts` | Minor — rate stays editable; display uses first price as placeholder |
| New migration SQL file | Create tables, seed data, drop old columns |
