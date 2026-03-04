// ── Gas Agency ERP — TypeScript types ───────────────────────

export type Role = 'Admin' | 'Staff' | 'Viewer';

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
  id: string; // UUID
  p: string; // SHA-256 hash
  active: boolean;
  createdAt: number;
}

// ── Item Master ──────────────────────────────────────────────
export interface Item {
  id: string; // UUID (maps to item_id in DB)
  name: string;
  unit: string;
  price: number;
  active: boolean;
}

// ── Stock  (keyed by item UUID) ──────────────────────────────
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
  id: string; // UUID (maps to customer_id in DB)
  name: string;
  phone: string;
  address: string;
  credit: boolean;
  outstanding: number;
  joinDate: string; // YYYY-MM-DD
  ledger?: LedgerEntry[];
}

// ── Bills ────────────────────────────────────────────────────
export interface BillLine {
  itemId: string; // UUID (maps to item_id in DB)
  itemName: string;
  qty: number;
  price: number;
  amount: number;
}

export interface Bill {
  id: string; // "INV-YYMMDD-NNN" (maps to bill_id in DB)
  date: string;
  customerId: string | null; // UUID
  customerName: string;
  payment: 'Cash' | 'UPI' | 'Credit';
  total: number;
  note: string;
  lines: BillLine[];
}

// ── Purchases ────────────────────────────────────────────────
export interface PurchaseLine {
  itemId: string; // UUID
  itemName: string;
  qty: number;
  rate: number;
  total: number;
}

export interface Purchase {
  id: string; // "P001" (maps to purchase_id in DB)
  date: string;
  note: string;
  grandTotal: number;
  lines: PurchaseLine[];
}

// ── Reports ──────────────────────────────────────────────────
export type TxnType =
  | 'CASH_TO_BANK'
  | 'BANK_TO_CASH'
  | 'EXPENSE_CASH'
  | 'EXPENSE_BANK';

export interface Transaction {
  id: string; // UUID (maps to transaction_id in DB)
  date: string;
  type: TxnType;
  amount: number;
  note: string;
}

export type OpeningBalances = Record<string, { cash: number; bank: number }>;

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
