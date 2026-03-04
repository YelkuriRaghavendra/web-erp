import { useState, useMemo, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useERPStore } from '../../core/store';
import { useToast } from '../../shared/hooks/useToast';
import { ym } from '../../core/constants';
import { syncTransaction, syncOpeningBalance } from '../../core/supabase';
import type { Transaction, TxnType } from '../../core/types';

export const TXN_TYPES = [
  { id: 'CASH_TO_BANK' as TxnType, label: 'Deposit to Bank',  icon: '💵→🏦', cashEffect: -1, bankEffect: +1, color: 'blue'  },
  { id: 'BANK_TO_CASH' as TxnType, label: 'Withdraw to Cash', icon: '🏦→💵', cashEffect: +1, bankEffect: -1, color: 'green' },
  { id: 'EXPENSE_CASH' as TxnType, label: 'Cash Expense',     icon: '💸',    cashEffect: -1, bankEffect:  0, color: 'red'   },
  { id: 'EXPENSE_BANK' as TxnType, label: 'Bank Expense',     icon: '🏦📤',  cashEffect:  0, bankEffect: -1, color: 'amber' },
] as const;

const EMPTY_FORM = {
  type:   'CASH_TO_BANK' as TxnType,
  amount: '',
  note:   '',
  date:   new Date().toISOString().slice(0, 10),
};

export const useAccounts = () => {
  const {
    bills, transactions, setTransactions,
    openingBalances, setOpeningBalances,
  } = useERPStore(
    useShallow(s => ({
      bills:              s.bills,
      transactions:       s.transactions,
      setTransactions:    s.setTransactions,
      openingBalances:    s.openingBalances,
      setOpeningBalances: s.setOpeningBalances,
    })),
  );
  const showToast = useToast();

  // Current month key (YYYY-MM)
  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);

  // ── Cash & Bank balances ───────────────────────────────────
  const {
    currentCash, currentBank,
    todayCash, todayUPI, todayDeposits, todayWithdrawals, todayExpenses,
    mCashSales, mUpiSales, mCashToBank, mBankToCash, mExpCash, mExpBank,
    cashOB, bankOB,
  } = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const ob    = openingBalances[currentMonth] ?? { cash: 0, bank: 0 };

    // Month-level aggregates from bills
    const mBills    = bills.filter(b => ym(b.date) === currentMonth);
    const mCashSales = mBills.filter(b => b.payment === 'Cash').reduce((s, b) => s + b.total, 0);
    const mUpiSales  = mBills.filter(b => b.payment === 'UPI').reduce((s, b) => s + b.total, 0);

    // Month-level aggregates from transactions
    const mTxns      = transactions.filter(t => ym(t.date) === currentMonth);
    const mCashToBank = mTxns.filter(t => t.type === 'CASH_TO_BANK').reduce((s, t) => s + t.amount, 0);
    const mBankToCash = mTxns.filter(t => t.type === 'BANK_TO_CASH').reduce((s, t) => s + t.amount, 0);
    const mExpCash    = mTxns.filter(t => t.type === 'EXPENSE_CASH').reduce((s, t) => s + t.amount, 0);
    const mExpBank    = mTxns.filter(t => t.type === 'EXPENSE_BANK').reduce((s, t) => s + t.amount, 0);

    // Today
    const todayBills = bills.filter(b => b.date === today);
    const todayCash  = todayBills.filter(b => b.payment === 'Cash').reduce((s, b) => s + b.total, 0);
    const todayUPI   = todayBills.filter(b => b.payment === 'UPI').reduce((s, b) => s + b.total, 0);

    const todayTxns       = transactions.filter(t => t.date === today);
    const todayDeposits   = todayTxns.filter(t => t.type === 'CASH_TO_BANK').reduce((s, t) => s + t.amount, 0);
    const todayWithdrawals = todayTxns.filter(t => t.type === 'BANK_TO_CASH').reduce((s, t) => s + t.amount, 0);
    const todayExpenses   = todayTxns.filter(t => t.type === 'EXPENSE_CASH' || t.type === 'EXPENSE_BANK').reduce((s, t) => s + t.amount, 0);

    return {
      currentCash: ob.cash + mCashSales + mBankToCash - mCashToBank - mExpCash,
      currentBank: ob.bank + mUpiSales  + mCashToBank - mBankToCash - mExpBank,
      todayCash, todayUPI, todayDeposits, todayWithdrawals, todayExpenses,
      mCashSales, mUpiSales, mCashToBank, mBankToCash, mExpCash, mExpBank,
      cashOB: ob.cash, bankOB: ob.bank,
    };
  }, [bills, transactions, openingBalances, currentMonth]);

  // Transaction history — latest first
  const txnHistory = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
    [transactions],
  );

  // ── Transaction entry modal ────────────────────────────────
  const [txnModal, setTxnModal] = useState(false);
  const [txnForm,  setTxnForm]  = useState(EMPTY_FORM);

  const openTxnModal = useCallback((type?: TxnType) => {
    setTxnForm({
      ...EMPTY_FORM,
      type: type ?? 'CASH_TO_BANK',
      date: new Date().toISOString().slice(0, 10),
    });
    setTxnModal(true);
  }, []);

  const setTxnField = useCallback(
    (k: keyof typeof EMPTY_FORM, v: string) =>
      setTxnForm(p => ({ ...p, [k]: v })),
    [],
  );

  const addTransaction = useCallback(() => {
    if (!txnForm.amount || +txnForm.amount <= 0) {
      showToast('Enter a valid amount', 'error');
      return;
    }
    const t: Transaction = {
      id:     crypto.randomUUID(),
      date:   txnForm.date,
      type:   txnForm.type,
      amount: +txnForm.amount,
      note:   txnForm.note,
    };
    setTransactions(p => [...p, t]);
    syncTransaction(t);
    setTxnModal(false);
    setTxnForm(EMPTY_FORM);
    showToast('Transaction recorded');
  }, [txnForm, setTransactions, showToast]);

  // ── Opening Balance modal ──────────────────────────────────
  const [obModal, setObModal] = useState(false);
  const [obForm,  setObForm]  = useState({ cash: '', bank: '' });

  const openOBModal = useCallback(() => {
    const ob = openingBalances[currentMonth] ?? { cash: 0, bank: 0 };
    setObForm({ cash: String(ob.cash), bank: String(ob.bank) });
    setObModal(true);
  }, [openingBalances, currentMonth]);

  const saveOB = useCallback(() => {
    const cash = +obForm.cash || 0;
    const bank = +obForm.bank || 0;
    setOpeningBalances(p => ({ ...p, [currentMonth]: { cash, bank } }));
    syncOpeningBalance(currentMonth, cash, bank);
    setObModal(false);
    showToast('Opening balances saved');
  }, [obForm, currentMonth, setOpeningBalances, showToast]);

  return {
    currentCash, currentBank,
    cashOB, bankOB,
    mCashSales, mUpiSales, mCashToBank, mBankToCash, mExpCash, mExpBank,
    todayCash, todayUPI, todayDeposits, todayWithdrawals, todayExpenses,
    currentMonth,
    txnHistory,
    TXN_TYPES,
    // transaction modal
    txnModal, setTxnModal, txnForm, setTxnField, addTransaction, openTxnModal,
    // OB modal
    obModal, setObModal, obForm, setObForm, openOBModal, saveOB,
  };
};
