import { useState, useMemo, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useERPStore } from '../../core/store';
import { useToast } from '../../shared/hooks/useToast';
import { ym, monthLabel, allMonths } from '../../core/constants';
import { syncOpeningBalance, syncDepositSettlement, syncTransaction } from '../../core/supabase';
import type { DepositSettlement, Transaction } from '../../core/types';

// ── Reports tabs ───────────────────────────────────────────────
// The Cash Book lives in the Cash & Bank page (/accounts), not here.
// Reports is a pure analytics/P&L view.
export const TABS = [
  { id: 'overview', l: 'P&L Overview' },
  { id: 'daily', l: 'Sales Report' },
  { id: 'credit', l: 'Credit Report' },
  { id: 'purchase', l: 'Purchases' },
  { id: 'deposits', l: 'Deposits' },
] as const;

export const useReports = () => {
  const {
    bills,
    customers,
    purchases,
    stock,
    items,
    openingBalances,
    setOpeningBalances,
    transactions,
    depositSettlements,
    setDepositSettlements,
    setTransactions,
  } = useERPStore(
    useShallow(s => ({
      bills: s.bills,
      customers: s.customers,
      purchases: s.purchases,
      stock: s.stock,
      items: s.items,
      openingBalances: s.openingBalances,
      setOpeningBalances: s.setOpeningBalances,
      transactions: s.transactions, // needed for expense totals in P&L
      depositSettlements: s.depositSettlements,
      setDepositSettlements: s.setDepositSettlements,
      setTransactions: s.setTransactions,
    }))
  );
  const showToast = useToast();

  // ── Tab state ─────────────────────────────────────────────
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('overview');

  // ── Opening balance edit modal ────────────────────────────
  const [editOB, setEditOB] = useState<{
    month: string;
    cashOB: number;
    bankOB: number;
  } | null>(null);

  const openOBModal = useCallback(
    (month: string) =>
      setEditOB({
        month,
        cashOB: openingBalances[month]?.cash ?? 0,
        bankOB: openingBalances[month]?.bank ?? 0,
      }),
    [openingBalances]
  );

  const saveOB = useCallback(() => {
    if (!editOB) return;
    setOpeningBalances(p => ({
      ...p,
      [editOB.month]: { cash: editOB.cashOB, bank: editOB.bankOB },
    }));
    syncOpeningBalance(editOB.month, editOB.cashOB, editOB.bankOB);
    setEditOB(null);
    showToast('Opening balances saved');
  }, [editOB, setOpeningBalances, showToast]);

  // ── Deposit stats ────────────────────────────────────────
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

  // ── Deposits by item ───────────────────────────────────
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

  // ── Settle deposits ────────────────────────────────────
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

    setDepositSettlements(prev => [settlement, ...prev]);
    syncDepositSettlement(settlement);

    const txn: Transaction = {
      id: `TXN-${Date.now()}`,
      date,
      type: 'DEPOSIT_SETTLEMENT',
      amount,
      note: note || 'Deposit settlement to company',
    };
    setTransactions(prev => [txn, ...prev]);
    syncTransaction(txn);

    showToast(`Settled \u20B9${amount.toLocaleString()} from bank`, 'success');
  }, [setDepositSettlements, setTransactions, showToast]);

  // ── Monthly P&L data ──────────────────────────────────────
  const months = useMemo(() => allMonths(bills, purchases), [bills, purchases]);

  const monthlyData = useMemo(
    () =>
      months.map(m => {
        // Revenue
        const mBills = bills.filter(b => ym(b.date) === m);
        const cashSales = mBills
          .filter(b => b.payment === 'Cash')
          .reduce((s, b) => s + b.total, 0);
        const upiSales = mBills
          .filter(b => b.payment === 'UPI')
          .reduce((s, b) => s + b.total, 0);
        const creditIn = mBills
          .filter(b => b.payment === 'Credit')
          .reduce((s, b) => s + b.total, 0);
        const total = cashSales + upiSales + creditIn;

        // Cost of purchases for this month
        const mPurchases = purchases.filter(p => ym(p.date) === m);
        const purchaseCost = mPurchases.reduce((s, p) => s + p.grandTotal, 0);

        // Expenses from transactions (cash + bank)
        const mTxns = transactions.filter(t => ym(t.date) === m);
        const expCash = mTxns
          .filter(t => t.type === 'EXPENSE_CASH')
          .reduce((s, t) => s + t.amount, 0);
        const expBank = mTxns
          .filter(t => t.type === 'EXPENSE_BANK')
          .reduce((s, t) => s + t.amount, 0);
        const totalExpenses = expCash + expBank;

        // Closing balances (needed for the CB columns in P&L table)
        const cashToBank = mTxns
          .filter(t => t.type === 'CASH_TO_BANK')
          .reduce((s, t) => s + t.amount, 0);
        const bankToCash = mTxns
          .filter(t => t.type === 'BANK_TO_CASH')
          .reduce((s, t) => s + t.amount, 0);
        const addToBank = mTxns
          .filter(t => t.type === 'ADD_TO_BANK')
          .reduce((s, t) => s + t.amount, 0);
        const addToCash = mTxns
          .filter(t => t.type === 'ADD_TO_CASH')
          .reduce((s, t) => s + t.amount, 0);
        const depositSettled = mTxns
          .filter(t => t.type === 'DEPOSIT_SETTLEMENT')
          .reduce((s, t) => s + t.amount, 0);
        const ob = openingBalances[m] ?? { cash: 0, bank: 0 };
        const cashCB = ob.cash + cashSales + bankToCash + addToCash - cashToBank - expCash;
        const bankCB = ob.bank + upiSales + cashToBank + addToBank - bankToCash - expBank - depositSettled;

        const grossProfit = total - purchaseCost;
        const netProfit = total - purchaseCost - totalExpenses;

        return {
          m,
          label: monthLabel(m),
          cashSales,
          upiSales,
          creditIn,
          total,
          purchaseCost,
          totalExpenses,
          grossProfit,
          netProfit,
          cashOB: ob.cash,
          bankOB: ob.bank,
          cashCB,
          bankCB,
          billCount: mBills.length,
          purchaseCount: mPurchases.length,
          totalDeposits: mBills.reduce((s, b) => s + b.lines.reduce((ls, l) => ls + l.qty * l.deposit, 0), 0),
          depositSettled,
        };
      }),
    [months, bills, purchases, transactions, openingBalances]
  );

  // ── Daily sales data ──────────────────────────────────────
  const dailyData = useMemo(() => {
    const byDate = new Map<
      string,
      { cash: number; upi: number; credit: number; count: number }
    >();
    bills.forEach(b => {
      const e = byDate.get(b.date) ?? { cash: 0, upi: 0, credit: 0, count: 0 };
      if (b.payment === 'Cash') e.cash += b.total;
      if (b.payment === 'UPI') e.upi += b.total;
      if (b.payment === 'Credit') e.credit += b.total;
      e.count++;
      byDate.set(b.date, e);
    });
    return [...byDate.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, v]) => ({ date, ...v, total: v.cash + v.upi + v.credit }));
  }, [bills]);

  // ── Credit customers ──────────────────────────────────────
  const creditCustomers = useMemo(
    () =>
      [...customers.filter(c => c.credit)].sort(
        (a, b) => b.outstanding - a.outstanding
      ),
    [customers]
  );

  // ── Purchase report ───────────────────────────────────────
  const inventoryValue = useMemo(
    () => items.reduce((s, it) => s + (stock[it.id]?.qty ?? 0) * (it.prices[0]?.price ?? 0), 0),
    [items, stock]
  );

  return {
    months,
    bills,
    purchases,
    customers,
    monthlyData,
    dailyData,
    creditCustomers,
    inventoryValue,
    tab,
    setTab,
    TABS,
    editOB,
    setEditOB,
    openOBModal,
    saveOB,
    depositStats,
    depositsByItem,
    depositSettlements,
    settleDeposits,
  };
};
