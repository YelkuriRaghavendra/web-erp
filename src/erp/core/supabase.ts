import { createClient } from '@supabase/supabase-js';
import type {
  Bill,
  Purchase,
  Item,
  ItemPrice,
  BundleComponent,
  ItemType,
  Customer,
  Stock,
  StaffUser,
  Role,
  Transaction,
  OpeningBalances,
  LedgerEntry,
  DepositSettlement,
} from './types';

// ── Client ────────────────────────────────────────────────────
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
);

// ── Current logged-in user — set by App.tsx after login ───────
// Used to stamp created_by / updated_by on every write.
// Defaults to 'system' for any writes that happen before login
// (should not occur in normal usage).
let _currentUser = 'system';

export const setCurrentUser = (username: string) => {
  _currentUser = username;
};

// ── Fire-and-forget helper ────────────────────────────────────
const bg = (label: string, q: PromiseLike<{ error: unknown }>) => {
  void q.then(({ error }) => {
    if (error) console.warn(`[Supabase sync] ${label}:`, error);
  });
};

// ── Timestamp helper ──────────────────────────────────────────
const ts = (v: unknown): number | undefined =>
  v ? new Date(v as string).getTime() : undefined;

// ── Audit field helper — returns the four audit fields from a row ─
const audit = (r: Record<string, unknown>) => ({
  createdAt: ts(r.created_at),
  updatedAt: ts(r.updated_at),
  createdBy: (r.created_by as string) || undefined,
  updatedBy: (r.updated_by as string) || undefined,
});

// ════════════════════════════════════════════════════════════════
//  FETCH  — DB uses <tablename>_id; TypeScript types use `id`
// ════════════════════════════════════════════════════════════════

export const fetchAllItems = async (): Promise<Item[]> => {
  // 1. Fetch items
  const { data: itemRows, error: itemErr } = await supabase
    .from('items')
    .select('*')
    .order('name');
  if (itemErr) { console.warn('[Supabase] fetchAllItems:', itemErr); return []; }
  if (!itemRows) return [];

  // 2. Fetch all prices
  const { data: priceRows } = await supabase
    .from('item_prices')
    .select('*')
    .order('sort_order', { ascending: true });

  // 3. Fetch all bundle components
  const { data: bundleRows } = await supabase
    .from('bundle_components')
    .select('*');

  // 4. Name lookup for component items
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
      deposit: Number(r.deposit ?? 0),
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
      unit: String(r.unit ?? 'Nos'),
      prices: pricesByItem[id] ?? [],
      active: Boolean(r.active),
      itemType: ((r.item_type as string) || 'regular') as ItemType,
      bundleComponents: componentsByBundle[id] ?? [],
      ...audit(r),
    };
  });
};

export const fetchStock = async (): Promise<Stock> => {
  const { data, error } = await supabase.from('stock').select('*');
  if (error) {
    console.warn('[Supabase] fetchStock:', error);
    return {};
  }
  const stock: Stock = {};
  (data ?? []).forEach(r => {
    stock[r.item_id as string] = { qty: Number(r.qty) };
  });
  return stock;
};

export const fetchCustomers = async (): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name');
  if (error) {
    console.warn('[Supabase] fetchCustomers:', error);
    return [];
  }
  return (data ?? []).map(r => ({
    id: r.customer_id as string,
    name: r.name as string,
    phone: (r.phone ?? '') as string,
    address: (r.address ?? '') as string,
    credit: r.credit as boolean,
    outstanding: Number(r.outstanding),
    joinDate: (r.join_date ?? '') as string,
    ledger: (r.ledger ?? []) as LedgerEntry[],
    ...audit(r as Record<string, unknown>),
  }));
};

export const fetchBills = async (): Promise<Bill[]> => {
  const { data, error } = await supabase
    .from('bills')
    .select('*, bill_lines(*)')
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('[Supabase] fetchBills:', error);
    return [];
  }
  return (data ?? []).map(b => ({
    id: b.bill_id as string,
    date: b.date as string,
    customerId: (b.customer_id ?? null) as string | null,
    customerName: (b.customer_name ?? '') as string,
    payment: b.payment as 'Cash' | 'UPI' | 'Credit',
    total: Number(b.total),
    note: (b.note ?? '') as string,
    lines: ((b.bill_lines as unknown[]) ?? []).map((l: unknown) => {
      const line = l as Record<string, unknown>;
      return {
        itemId: line.item_id as string,
        itemName: line.item_name as string,
        qty: Number(line.qty),
        price: Number(line.price),
        deposit: Number(line.deposit ?? 0),
        amount: Number(line.amount),
      };
    }),
    ...audit(b as Record<string, unknown>),
  }));
};

export const fetchPurchases = async (): Promise<Purchase[]> => {
  const { data, error } = await supabase
    .from('purchases')
    .select('*, purchase_lines(*)')
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('[Supabase] fetchPurchases:', error);
    return [];
  }
  return (data ?? []).map(p => ({
    id: p.purchase_id as string,
    date: p.date as string,
    note: (p.note ?? '') as string,
    vehicleNo: (p.vehicle_no ?? '') as string,
    salesOrderRef: (p.sales_order_ref ?? '') as string,
    grandTotal: Number(p.grand_total),
    lines: ((p.purchase_lines as unknown[]) ?? []).map((l: unknown) => {
      const line = l as Record<string, unknown>;
      return {
        itemId: line.item_id as string,
        itemName: line.item_name as string,
        qty: Number(line.qty),
        rate: Number(line.rate),
        total: Number(line.total),
      };
    }),
    ...audit(p as Record<string, unknown>),
  }));
};

export const fetchTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date');
  if (error) {
    console.warn('[Supabase] fetchTransactions:', error);
    return [];
  }
  return (data ?? []).map(r => ({
    id: r.transaction_id as string,
    date: r.date as string,
    type: r.type as Transaction['type'],
    amount: Number(r.amount),
    note: (r.note ?? '') as string,
    ...audit(r as Record<string, unknown>),
  }));
};

export const fetchOpeningBalances = async (): Promise<OpeningBalances> => {
  const { data, error } = await supabase.from('opening_balances').select('*');
  if (error) {
    console.warn('[Supabase] fetchOpeningBalances:', error);
    return {};
  }
  const ob: OpeningBalances = {};
  (data ?? []).forEach(r => {
    ob[r.month as string] = {
      cash: Number(r.cash),
      bank: Number(r.bank),
      ...audit(r as Record<string, unknown>),
    };
  });
  return ob;
};

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

/** Staff list for management page — password is NEVER sent to the browser. */
export const fetchAllStaff = async (): Promise<StaffUser[]> => {
  const { data, error } = await supabase
    .from('staff')
    .select('staff_id, username, name, role, active, created_at, updated_at, created_by, updated_by'); // no password column
  if (error) {
    console.warn('[Supabase] fetchAllStaff:', error);
    return [];
  }
  return (data ?? []).map(r => ({
    id: String(r.staff_id),
    u: r.username as string,
    name: r.name as string,
    role: r.role as Role,
    p: '', // never expose hash to the client via list fetch
    active: r.active as boolean,
    createdAt: r.created_at
      ? new Date(r.created_at as string).getTime()
      : Date.now(),
    updatedAt: ts(r.updated_at),
    createdBy: (r.created_by as string) || undefined,
    updatedBy: (r.updated_by as string) || undefined,
  }));
};

/**
 * Server-side login check via Postgres RPC.
 *
 * The SHA-256 hash is sent to the DB; the DB compares it against the stored
 * hash internally and returns only safe user fields on success.
 * The password column is NEVER returned to the browser — invisible in DevTools.
 *
 * Requires migration 005_login_rpc.sql to be applied in Supabase.
 */
export const checkStaffLogin = async (
  username: string,
  hashedPassword: string,
): Promise<
  | { ok: true; user: StaffUser }
  | { ok: false; reason: 'not_found' | 'wrong_password' | 'inactive' | 'error' }
> => {
  const { data, error } = await supabase.rpc('check_staff_login', {
    p_username: username,
    p_password_hash: hashedPassword,
  });
  if (error) return { ok: false, reason: 'error' };
  const d = data as Record<string, unknown> | null;
  if (!d || !d.ok) {
    const reason = d?.reason as 'not_found' | 'wrong_password' | 'inactive' | undefined;
    return { ok: false, reason: reason ?? 'not_found' };
  }
  return {
    ok: true,
    user: {
      id: String(d.staff_id),
      u: d.username as string,
      name: d.name as string,
      role: d.role as Role,
      p: '',  // password hash never returned — stays in DB
      active: d.active as boolean,
      createdAt: d.created_at
        ? new Date(d.created_at as string).getTime()
        : Date.now(),
    },
  };
};

/**
 * Lightweight session-validation query: returns only the active flag and
 * role for the given username.  Used during bootstrap to cross-check the
 * stored session against the DB without fetching all staff rows.
 */
export const fetchCurrentUserStatus = async (
  username: string,
): Promise<{ active: boolean; role: Role } | null> => {
  const { data, error } = await supabase
    .from('staff')
    .select('active, role')
    .eq('username', username)
    .maybeSingle();
  if (error || !data) return null;
  return { active: data.active as boolean, role: data.role as Role };
};

// ════════════════════════════════════════════════════════════════
//  INSERT  — DB generates bigserial ID; returns it as string
// ════════════════════════════════════════════════════════════════

/** Insert a new item row; returns the DB-generated item_id as string. */
export const insertItem = async (data: Omit<Item, 'id'>): Promise<string> => {
  // 1. Insert item row (no price or stock_source_id columns anymore)
  const { data: row, error } = await supabase
    .from('items')
    .insert({
      name: data.name,
      unit: data.unit,
      active: data.active,
      item_type: data.itemType ?? 'regular',
      created_by: _currentUser,
      updated_by: _currentUser,
    })
    .select('item_id')
    .single();
  if (error) throw error;
  const itemId = String((row as { item_id: unknown }).item_id);

  // 2. Insert prices
  if (data.prices.length > 0) {
    await supabase.from('item_prices').insert(
      data.prices.map((p, idx) => ({
        item_id: Number(itemId),
        price: p.price,
        deposit: p.deposit ?? 0,
        sort_order: p.sortOrder ?? idx,
      }))
    );
  }

  // 3. Insert bundle components (for linked items)
  if (data.bundleComponents.length > 0) {
    await supabase.from('bundle_components').insert(
      data.bundleComponents.map(c => ({
        bundle_item_id: Number(itemId),
        component_item_id: Number(c.componentItemId),
        qty: c.qty,
      }))
    );
  }

  return itemId;
};

/** Insert a stock row with qty=0 for a newly created item. */
export const insertStockRow = async (itemId: string): Promise<void> => {
  const { error } = await supabase
    .from('stock')
    .insert({
      item_id: itemId,
      qty: 0,
      created_by: _currentUser,
      updated_by: _currentUser,
    });
  if (error) console.warn('[Supabase] insertStockRow:', error);
};

/** Delete an item and its related data (prices, components, stock). */
export const deleteItem = async (itemId: string): Promise<void> => {
  // item_prices and bundle_components cascade on delete.
  // stock also cascades. Delete the item row — everything else follows.
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('item_id', Number(itemId));
  if (error) throw error;
};

/** Insert a new customer row; returns the DB-generated customer_id as string. */
export const insertCustomer = async (data: Omit<Customer, 'id'>): Promise<string> => {
  const { data: row, error } = await supabase
    .from('customers')
    .insert({
      name: data.name,
      phone: data.phone,
      address: data.address,
      credit: data.credit,
      outstanding: data.outstanding,
      join_date: data.joinDate,
      ledger: data.ledger ?? [],
      created_by: _currentUser,
      updated_by: _currentUser,
    })
    .select('customer_id')
    .single();
  if (error) throw error;
  return String((row as { customer_id: unknown }).customer_id);
};

/** Insert a new staff row; returns the DB-generated staff_id as string. */
export const insertStaffMember = async (data: Omit<StaffUser, 'id'>): Promise<string> => {
  const { data: row, error } = await supabase
    .from('staff')
    .insert({
      username: data.u,
      name: data.name,
      role: data.role,
      active: data.active,
      password: data.p,
      created_at: new Date(data.createdAt).toISOString(),
      created_by: _currentUser,
      updated_by: _currentUser,
    })
    .select('staff_id')
    .single();
  if (error) throw error;
  return String((row as { staff_id: unknown }).staff_id);
};

/** Insert a new transaction row; returns the DB-generated transaction_id as string. */
export const insertTransaction = async (data: Omit<Transaction, 'id'>): Promise<string> => {
  const { data: row, error } = await supabase
    .from('transactions')
    .insert({
      date: data.date,
      type: data.type,
      amount: data.amount,
      note: data.note,
      created_by: _currentUser,
      updated_by: _currentUser,
    })
    .select('transaction_id')
    .single();
  if (error) throw error;
  return String((row as { transaction_id: unknown }).transaction_id);
};

// ════════════════════════════════════════════════════════════════
//  SYNC  — TypeScript `id` maps to DB `<tablename>_id`
//  All syncs include updated_by = _currentUser.
//  The preserve_created_audit DB trigger keeps the original
//  created_by / created_at if the row already exists.
// ════════════════════════════════════════════════════════════════

export const syncBill = (bill: Bill) => {
  // Header must be committed before lines (FK constraint on bill_id)
  void supabase.from('bills').upsert({
    bill_id: bill.id,
    date: bill.date,
    customer_id: bill.customerId,
    customer_name: bill.customerName,
    payment: bill.payment,
    total: bill.total,
    note: bill.note,
    created_by: _currentUser,
    updated_by: _currentUser,
  }).then(({ error }) => {
    if (error) { console.warn('[Supabase sync] upsert bill:', error); return; }
    bg(
      'insert bill_lines',
      supabase.from('bill_lines').insert(
        bill.lines.map(l => ({
          bill_id: bill.id,
          item_id: Number(l.itemId),
          item_name: l.itemName,
          qty: l.qty,
          price: l.price,
          deposit: l.deposit ?? 0,
          amount: l.amount,
          created_by: _currentUser,
          updated_by: _currentUser,
        }))
      )
    );
  });
};

export const syncPurchase = (po: Purchase) => {
  // Header must be committed before lines (FK constraint on purchase_id)
  void supabase.from('purchases').upsert({
    purchase_id: po.id,
    date: po.date,
    note: po.note,
    vehicle_no: po.vehicleNo ?? '',
    sales_order_ref: po.salesOrderRef ?? '',
    grand_total: po.grandTotal,
    created_by: _currentUser,
    updated_by: _currentUser,
  }).then(({ error }) => {
    if (error) { console.warn('[Supabase sync] upsert purchase:', error); return; }
    bg(
      'upsert purchase_lines',
      supabase.from('purchase_lines').insert(
        po.lines.map(l => ({
          purchase_id: po.id,
          item_id: Number(l.itemId),
          item_name: l.itemName,
          qty: l.qty,
          rate: l.rate,
          total: l.total,
          created_by: _currentUser,
          updated_by: _currentUser,
        }))
      )
    );
  });
};

// Update an existing bill: upsert header, delete old lines, insert new lines
export const syncBillUpdate = (bill: Bill) => {
  void supabase.from('bills').upsert({
    bill_id: bill.id,
    date: bill.date,
    customer_id: bill.customerId,
    customer_name: bill.customerName,
    payment: bill.payment,
    total: bill.total,
    note: bill.note,
    updated_by: _currentUser,
  }).then(({ error }) => {
    if (error) { console.warn('[Supabase sync] update bill header:', error); return; }
    void supabase.from('bill_lines').delete().eq('bill_id', bill.id).then(({ error: delErr }) => {
      if (delErr) { console.warn('[Supabase sync] delete bill_lines:', delErr); return; }
      bg('insert updated bill_lines', supabase.from('bill_lines').insert(
        bill.lines.map(l => ({
          bill_id: bill.id,
          item_id: Number(l.itemId),
          item_name: l.itemName,
          qty: l.qty,
          price: l.price,
          deposit: l.deposit ?? 0,
          amount: l.amount,
          created_by: _currentUser,
          updated_by: _currentUser,
        }))
      ));
    });
  });
};

// Update an existing purchase: upsert header, delete old lines, insert new lines
export const syncPurchaseUpdate = (po: Purchase) => {
  void supabase.from('purchases').upsert({
    purchase_id: po.id,
    date: po.date,
    note: po.note,
    vehicle_no: po.vehicleNo ?? '',
    sales_order_ref: po.salesOrderRef ?? '',
    grand_total: po.grandTotal,
    updated_by: _currentUser,
  }).then(({ error }) => {
    if (error) { console.warn('[Supabase sync] update purchase header:', error); return; }
    void supabase.from('purchase_lines').delete().eq('purchase_id', po.id).then(({ error: delErr }) => {
      if (delErr) { console.warn('[Supabase sync] delete purchase_lines:', delErr); return; }
      bg('insert updated purchase_lines', supabase.from('purchase_lines').insert(
        po.lines.map(l => ({
          purchase_id: po.id,
          item_id: Number(l.itemId),
          item_name: l.itemName,
          qty: l.qty,
          rate: l.rate,
          total: l.total,
          created_by: _currentUser,
          updated_by: _currentUser,
        }))
      ));
    });
  });
};

export const syncItems = async (items: Item[]) => {
  for (const item of items) {
    // 1. Upsert item row
    bg('upsert item', supabase.from('items').upsert({
      item_id: item.id,
      name: item.name,
      unit: item.unit,
      active: item.active,
      item_type: item.itemType ?? 'regular',
      updated_at: new Date().toISOString(),
      updated_by: _currentUser,
    }));

    // 2. Replace prices: delete old, insert new
    await supabase.from('item_prices').delete().eq('item_id', Number(item.id));
    if (item.prices.length > 0) {
      await supabase.from('item_prices').insert(
        item.prices.map((p, idx) => ({
          item_id: Number(item.id),
          price: p.price,
          deposit: p.deposit ?? 0,
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

export const syncStock = (stock: Stock) => {
  const rows = Object.entries(stock).map(([item_id, s]) => ({
    item_id,
    qty: s.qty,
    created_by: _currentUser,
    updated_by: _currentUser,
  }));
  if (rows.length) bg('upsert stock', supabase.from('stock').upsert(rows));
};

export const syncCustomer = (c: Customer) => {
  bg(
    'upsert customer',
    supabase.from('customers').upsert({
      customer_id: c.id,
      name: c.name,
      phone: c.phone,
      address: c.address,
      credit: c.credit,
      outstanding: c.outstanding,
      join_date: c.joinDate,
      ledger: c.ledger ?? [],
      created_by: _currentUser,
      updated_by: _currentUser,
    })
  );
};

export const syncTransaction = (t: Transaction) => {
  bg(
    'upsert transaction',
    supabase.from('transactions').upsert({
      transaction_id: t.id,
      date: t.date,
      type: t.type,
      amount: t.amount,
      note: t.note,
      created_by: _currentUser,
      updated_by: _currentUser,
    })
  );
};

export const syncOpeningBalance = (
  month: string,
  cash: number,
  bank: number
) => {
  bg(
    'upsert opening_balance',
    supabase.from('opening_balances').upsert({
      month,
      cash,
      bank,
      created_by: _currentUser,
      updated_by: _currentUser,
    })
  );
};

export const syncDepositSettlement = (s: DepositSettlement) => {
  bg('insert deposit_settlement', supabase.from('deposit_settlements').insert({
    date: s.date,
    amount: s.amount,
    note: s.note,
    created_by: _currentUser,
  }));
};

export const syncStaffMember = (s: StaffUser) => {
  // s.p is '' when loaded via fetchAllStaff (password never fetched in list view).
  // Only include the password column when we actually have a hash to write,
  // to avoid accidentally overwriting the stored hash with an empty string.
  const payload: Record<string, unknown> = {
    staff_id: s.id,
    username: s.u,
    name: s.name,
    role: s.role,
    active: s.active,
    created_at: new Date(s.createdAt).toISOString(),
    created_by: _currentUser,
    updated_by: _currentUser,
  };
  if (s.p) payload.password = s.p; // only set when resetting a password
  bg('upsert staff', supabase.from('staff').upsert(payload));
};

// ════════════════════════════════════════════════════════════════
//  MIGRATIONS — auto-run on bootstrap
// ════════════════════════════════════════════════════════════════
//
// Migration SQL files live in db/migrations/ and are imported as
// raw strings via Vite's ?raw suffix. Each migration runs once —
// the _migrations table tracks which versions have been applied.
// ────────────────────────────────────────────────────────────────

import migration001 from '../../../db/migrations/20260411_001_full_schema.sql?raw';

interface Migration {
  version: number;
  name: string;
  up: string; // raw SQL imported from db/migrations/
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: '20260411_001_full_schema',
    up: migration001,
  },
];

/**
 * Run pending migrations. Tracks applied versions in `_migrations` table.
 * Safe to call on every bootstrap — already-applied migrations are skipped.
 */
export const runMigrations = async (): Promise<void> => {
  // Ensure _migrations tracking table exists
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public._migrations (
        version  int PRIMARY KEY,
        name     text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      );
    `,
  }).then(({ error }) => {
    if (error) {
      console.warn('[Migrations] exec_sql RPC not available — run db/migrations/20260411_001_full_schema.sql manually');
    }
  });

  // Check which migrations have been applied
  const { data: applied } = await supabase
    .from('_migrations')
    .select('version');

  const appliedVersions = new Set(
    (applied ?? []).map((r: { version: number }) => r.version)
  );

  for (const migration of MIGRATIONS) {
    if (appliedVersions.has(migration.version)) continue;

    console.log(`[Migrations] Running ${migration.name}...`);
    const { error } = await supabase.rpc('exec_sql', { sql: migration.up });
    if (error) {
      console.error(`[Migrations] Failed ${migration.name}:`, error);
      continue;
    }

    // Record migration as applied
    await supabase.from('_migrations').insert({
      version: migration.version,
      name: migration.name,
    });
    console.log(`[Migrations] Completed ${migration.name}`);
  }
};
