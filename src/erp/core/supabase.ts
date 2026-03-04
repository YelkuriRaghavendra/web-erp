import { createClient } from '@supabase/supabase-js';
import type {
  Bill, Purchase, Item, Customer, Stock,
  StaffUser, Role, Transaction, OpeningBalances, LedgerEntry,
} from './types';

// ── Client ────────────────────────────────────────────────────
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
);

// ── Fire-and-forget helper ────────────────────────────────────
const bg = (label: string, q: PromiseLike<{ error: unknown }>) => {
  void q.then(({ error }) => {
    if (error) console.warn(`[Supabase sync] ${label}:`, error);
  });
};

// ════════════════════════════════════════════════════════════════
//  FETCH  — DB uses <tablename>_id; TypeScript types use `id`
// ════════════════════════════════════════════════════════════════

export const fetchAllItems = async (): Promise<Item[]> => {
  const { data, error } = await supabase.from('items').select('*').order('name');
  if (error) { console.warn('[Supabase] fetchAllItems:', error); return []; }
  return (data ?? []).map(r => ({
    id:     r.item_id as string,
    name:   r.name    as string,
    unit:   (r.unit   ?? 'Nos') as string,
    price:  Number(r.price),
    active: r.active  as boolean,
  }));
};

export const fetchStock = async (): Promise<Stock> => {
  const { data, error } = await supabase.from('stock').select('*');
  if (error) { console.warn('[Supabase] fetchStock:', error); return {}; }
  const stock: Stock = {};
  (data ?? []).forEach(r => { stock[r.item_id as string] = { qty: Number(r.qty) }; });
  return stock;
};

export const fetchCustomers = async (): Promise<Customer[]> => {
  const { data, error } = await supabase.from('customers').select('*').order('name');
  if (error) { console.warn('[Supabase] fetchCustomers:', error); return []; }
  return (data ?? []).map(r => ({
    id:          r.customer_id  as string,
    name:        r.name         as string,
    phone:       (r.phone       ?? '') as string,
    address:     (r.address     ?? '') as string,
    credit:      r.credit       as boolean,
    outstanding: Number(r.outstanding),
    joinDate:    (r.join_date   ?? '') as string,
    ledger:      (r.ledger      ?? []) as LedgerEntry[],
  }));
};

export const fetchBills = async (): Promise<Bill[]> => {
  const { data, error } = await supabase
    .from('bills')
    .select('*, bill_lines(*)')
    .order('created_at', { ascending: false });
  if (error) { console.warn('[Supabase] fetchBills:', error); return []; }
  return (data ?? []).map(b => ({
    id:           b.bill_id       as string,
    date:         b.date          as string,
    customerId:   (b.customer_id  ?? null) as string | null,
    customerName: (b.customer_name ?? '') as string,
    payment:      b.payment       as 'Cash' | 'UPI' | 'Credit',
    total:        Number(b.total),
    note:         (b.note         ?? '') as string,
    lines: ((b.bill_lines as unknown[]) ?? []).map((l: unknown) => {
      const line = l as Record<string, unknown>;
      return {
        itemId:   line.item_id   as string,
        itemName: line.item_name as string,
        qty:      Number(line.qty),
        price:    Number(line.price),
        amount:   Number(line.amount),
      };
    }),
  }));
};

export const fetchPurchases = async (): Promise<Purchase[]> => {
  const { data, error } = await supabase
    .from('purchases')
    .select('*, purchase_lines(*)')
    .order('created_at', { ascending: false });
  if (error) { console.warn('[Supabase] fetchPurchases:', error); return []; }
  return (data ?? []).map(p => ({
    id:         p.purchase_id as string,
    date:       p.date        as string,
    note:       (p.note       ?? '') as string,
    grandTotal: Number(p.grand_total),
    lines: ((p.purchase_lines as unknown[]) ?? []).map((l: unknown) => {
      const line = l as Record<string, unknown>;
      return {
        itemId:   line.item_id   as string,
        itemName: line.item_name as string,
        qty:      Number(line.qty),
        rate:     Number(line.rate),
        total:    Number(line.total),
      };
    }),
  }));
};

export const fetchTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase.from('transactions').select('*').order('date');
  if (error) { console.warn('[Supabase] fetchTransactions:', error); return []; }
  return (data ?? []).map(r => ({
    id:     r.transaction_id as string,
    date:   r.date           as string,
    type:   r.type           as Transaction['type'],
    amount: Number(r.amount),
    note:   (r.note          ?? '') as string,
  }));
};

export const fetchOpeningBalances = async (): Promise<OpeningBalances> => {
  const { data, error } = await supabase.from('opening_balances').select('*');
  if (error) { console.warn('[Supabase] fetchOpeningBalances:', error); return {}; }
  const ob: OpeningBalances = {};
  (data ?? []).forEach(r => {
    ob[r.month as string] = { cash: Number(r.cash), bank: Number(r.bank) };
  });
  return ob;
};

export const fetchAllStaff = async (): Promise<StaffUser[]> => {
  const { data, error } = await supabase.from('staff').select('*');
  if (error) { console.warn('[Supabase] fetchAllStaff:', error); return []; }
  return (data ?? []).map(r => ({
    id:        r.staff_id  as string,
    u:         r.username  as string,
    name:      r.name      as string,
    role:      r.role      as Role,
    p:         r.password  as string,
    active:    r.active    as boolean,
    createdAt: r.created_at ? new Date(r.created_at as string).getTime() : Date.now(),
  }));
};

// ════════════════════════════════════════════════════════════════
//  SYNC  — TypeScript `id` maps to DB `<tablename>_id`
// ════════════════════════════════════════════════════════════════

export const syncBill = (bill: Bill) => {
  bg('upsert bill', supabase.from('bills').upsert({
    bill_id:       bill.id,
    date:          bill.date,
    customer_id:   bill.customerId,
    customer_name: bill.customerName,
    payment:       bill.payment,
    total:         bill.total,
    note:          bill.note,
  }));
  bg('upsert bill_lines', supabase.from('bill_lines').upsert(
    bill.lines.map(l => ({
      bill_id:   bill.id,
      item_id:   l.itemId,
      item_name: l.itemName,
      qty:       l.qty,
      price:     l.price,
      amount:    l.amount,
    })),
  ));
};

export const syncPurchase = (po: Purchase) => {
  bg('upsert purchase', supabase.from('purchases').upsert({
    purchase_id: po.id,
    date:        po.date,
    note:        po.note,
    grand_total: po.grandTotal,
  }));
  bg('upsert purchase_lines', supabase.from('purchase_lines').upsert(
    po.lines.map(l => ({
      purchase_id: po.id,
      item_id:     l.itemId,
      item_name:   l.itemName,
      qty:         l.qty,
      rate:        l.rate,
      total:       l.total,
    })),
  ));
};

export const syncItems = (items: Item[]) => {
  bg('upsert items', supabase.from('items').upsert(
    items.map(i => ({ item_id: i.id, name: i.name, unit: i.unit, price: i.price, active: i.active })),
  ));
};

export const syncStock = (stock: Stock) => {
  const rows = Object.entries(stock).map(([item_id, s]) => ({ item_id, qty: s.qty }));
  if (rows.length) bg('upsert stock', supabase.from('stock').upsert(rows));
};

export const syncCustomer = (c: Customer) => {
  bg('upsert customer', supabase.from('customers').upsert({
    customer_id:  c.id,
    name:         c.name,
    phone:        c.phone,
    address:      c.address,
    credit:       c.credit,
    outstanding:  c.outstanding,
    join_date:    c.joinDate,
    ledger:       c.ledger ?? [],
  }));
};

export const syncTransaction = (t: Transaction) => {
  bg('upsert transaction', supabase.from('transactions').upsert({
    transaction_id: t.id,
    date:           t.date,
    type:           t.type,
    amount:         t.amount,
    note:           t.note,
  }));
};

export const syncOpeningBalance = (month: string, cash: number, bank: number) => {
  bg('upsert opening_balance', supabase.from('opening_balances').upsert({ month, cash, bank }));
};

export const syncStaffMember = (s: StaffUser) => {
  bg('upsert staff', supabase.from('staff').upsert({
    staff_id:   s.id,
    username:   s.u,
    name:       s.name,
    role:       s.role,
    active:     s.active,
    password:   s.p,
    created_at: new Date(s.createdAt).toISOString(),
  }));
};
