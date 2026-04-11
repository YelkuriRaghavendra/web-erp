import { create } from 'zustand';
import type {
  Item,
  Stock,
  Customer,
  Bill,
  Purchase,
  Transaction,
  OpeningBalances,
  StaffUser,
  DepositSettlement,
} from './types';

// ── Generic functional-updater helper ────────────────────────
type Setter<T> = T | ((prev: T) => T);
const apply = <T>(prev: T, v: Setter<T>): T =>
  typeof v === 'function' ? (v as (p: T) => T)(prev) : v;

// ── Store interface ───────────────────────────────────────────
interface ERPStore {
  items: Item[];
  stock: Stock;
  customers: Customer[];
  bills: Bill[];
  purchases: Purchase[];
  openingBalances: OpeningBalances;
  transactions: Transaction[];
  depositSettlements: DepositSettlement[];
  staff: StaffUser[];

  setItems: (v: Setter<Item[]>) => void;
  setStock: (v: Setter<Stock>) => void;
  setCustomers: (v: Setter<Customer[]>) => void;
  setBills: (v: Setter<Bill[]>) => void;
  setPurchases: (v: Setter<Purchase[]>) => void;
  setOpeningBalances: (v: Setter<OpeningBalances>) => void;
  setTransactions: (v: Setter<Transaction[]>) => void;
  setDepositSettlements: (v: Setter<DepositSettlement[]>) => void;
  setStaff: (v: Setter<StaffUser[]>) => void;
}

// Pure in-memory store — Supabase is the single source of truth.
// All data is fetched from Supabase on app boot; no localStorage.
export const useERPStore = create<ERPStore>()(set => ({
  items: [],
  stock: {},
  customers: [],
  bills: [],
  purchases: [],
  openingBalances: {},
  transactions: [],
  depositSettlements: [],
  staff: [],

  setItems: v => set(s => ({ items: apply(s.items, v) })),
  setStock: v => set(s => ({ stock: apply(s.stock, v) })),
  setCustomers: v => set(s => ({ customers: apply(s.customers, v) })),
  setBills: v => set(s => ({ bills: apply(s.bills, v) })),
  setPurchases: v => set(s => ({ purchases: apply(s.purchases, v) })),
  setOpeningBalances: v =>
    set(s => ({ openingBalances: apply(s.openingBalances, v) })),
  setTransactions: v => set(s => ({ transactions: apply(s.transactions, v) })),
  setDepositSettlements: v => set(s => ({ depositSettlements: apply(s.depositSettlements, v) })),
  setStaff: v => set(s => ({ staff: apply(s.staff, v) })),
}));
