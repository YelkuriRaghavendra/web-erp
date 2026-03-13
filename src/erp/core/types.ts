// ── Gas Agency ERP — TypeScript types ───────────────────────

export type Role = 'Admin' | 'Billing';

// All navigable page ids — single source of truth
export type PageId =
  | 'dashboard'
  | 'billing'
  | 'purchase'
  | 'customers'
  | 'ledger'
  | 'accounts'
  | 'reports'
  | 'items'
  | 'staff';

// Session token — never carries the password
export interface ERPUser {
  u: string;
  role: Role;
  name: string;
  createdAt: number; // timestamp — used for session expiry
}

// ── Staff (persisted users with role management) ──────────────
export interface StaffUser extends ERPUser {
  id: string; // bigserial as string
  p: string; // SHA-256 hash
  active: boolean;
  createdAt: number;
  // audit
  updatedAt?: number;
  createdBy?: string;
  updatedBy?: string;
}

// ── Item behaviour — stored in DB, drives purchase/billing logic ─
// 'regular'  → own stock; appears in purchase + billing
// 'cylinder' → own stock; shown in Cylinders section; purchase + billing
// 'linked'   → NO own stock; draws from stockSourceId when billed;
//              NEVER shown in the purchase form
export type ItemType = 'regular' | 'cylinder' | 'linked';

// ── Item Master ──────────────────────────────────────────────
export interface Item {
  id: string;           // bigserial as string (maps to item_id in DB)
  name: string;
  unit: string;
  price: number;
  active: boolean;
  itemType: ItemType;          // maps to item_type in DB
  stockSourceId: string | null; // maps to stock_source_id; set only for 'linked' items
  // audit
  createdAt?: number;
  updatedAt?: number;
  createdBy?: string;
  updatedBy?: string;
}

// ── Stock  (keyed by item id) ────────────────────────────────
// Stock is a live snapshot; audit is stored in DB but not surfaced
// in TypeScript to keep the Record shape simple.
export type Stock = Record<string, { qty: number }>;

// ── Customers ────────────────────────────────────────────────
export interface LedgerEntry {
  id: string; // UUID
  type: 'DEBIT' | 'CREDIT';
  date: string; // YYYY-MM-DD
  amount: number;
  description: string;
  balance: number;
}

export interface Customer {
  id: string; // bigserial as string (maps to customer_id in DB)
  name: string;
  phone: string;
  address: string;
  credit: boolean;
  outstanding: number;
  joinDate: string; // YYYY-MM-DD
  ledger?: LedgerEntry[];
  // audit
  createdAt?: number;
  updatedAt?: number;
  createdBy?: string;
  updatedBy?: string;
}

// ── Bills ────────────────────────────────────────────────────
export interface BillLine {
  itemId: string; // bigserial as string (maps to item_id in DB)
  itemName: string;
  qty: number;
  price: number;
  amount: number;
}

export interface Bill {
  id: string;    // "INV-YYMMDD-NNN" (maps to bill_id in DB — text column)
  date: string;
  customerId: string | null;
  customerName: string;
  payment: 'Cash' | 'UPI' | 'Credit';
  total: number;
  note: string;
  lines: BillLine[];
  // audit
  createdAt?: number;
  updatedAt?: number;
  createdBy?: string;
  updatedBy?: string;
}

// ── Purchases ────────────────────────────────────────────────
export interface PurchaseLine {
  itemId: string; // bigserial as string
  itemName: string;
  qty: number;
  rate: number;
  total: number;
}

export interface Purchase {
  id: string; // "PO-YYMMDD-NNN" (maps to purchase_id in DB — text column)
  date: string;
  note: string;
  grandTotal: number;
  lines: PurchaseLine[];
  // audit
  createdAt?: number;
  updatedAt?: number;
  createdBy?: string;
  updatedBy?: string;
}

// ── Reports ──────────────────────────────────────────────────
export type TxnType =
  | 'CASH_TO_BANK'
  | 'BANK_TO_CASH'
  | 'EXPENSE_CASH'
  | 'EXPENSE_BANK'
  | 'ADD_TO_BANK'
  | 'ADD_TO_CASH';

export interface Transaction {
  id: string; // bigserial as string (maps to transaction_id in DB)
  date: string;
  type: TxnType;
  amount: number;
  note: string;
  // audit
  createdAt?: number;
  updatedAt?: number;
  createdBy?: string;
  updatedBy?: string;
}

// ── Opening Balances ─────────────────────────────────────────
export interface OpeningBalance {
  cash: number;
  bank: number;
  // audit
  createdAt?: number;
  updatedAt?: number;
  createdBy?: string;
  updatedBy?: string;
}

export type OpeningBalances = Record<string, OpeningBalance>;

// ── Top-level store state ────────────────────────────────────
export interface ERPState {
  items: Item[];
  stock: Stock;
  customers: Customer[];
  bills: Bill[];
  purchases: Purchase[];
  openingBalances: OpeningBalances;
  transactions: Transaction[];
  staff: StaffUser[];
}
