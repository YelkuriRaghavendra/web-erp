import { useState, useMemo, useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useERPStore } from '../../core/store';
import { useToast } from '../../shared/hooks/useToast';
import { syncBill, syncCustomer } from '../../core/supabase';
import type { Bill, BillLine } from '../../core/types';

type QtysMap = Record<string, { qty: string; rate: string }>;

export const useBilling = () => {
  const { items, stock, customers, bills, setBills, setStock, setCustomers } =
    useERPStore(
      useShallow(s => ({
        items: s.items,
        stock: s.stock,
        customers: s.customers,
        bills: s.bills,
        setBills: s.setBills,
        setStock: s.setStock,
        setCustomers: s.setCustomers,
      }))
    );
  const showToast = useToast();

  const today = new Date().toISOString().slice(0, 10);

  // Only show items that are active AND have stock available
  const activeItems = useMemo(
    () => items.filter(i => i.active && (stock[i.id]?.qty ?? 0) > 0),
    [items, stock]
  );

  // ── Build an empty qty map keyed by item id ───────────────
  const makeEmptyQtys = useCallback((): QtysMap => {
    const q: QtysMap = {};
    activeItems.forEach(i => {
      q[i.id] = { qty: '', rate: String(i.price) };
    });
    return q;
  }, [activeItems]);

  // ── Form state ────────────────────────────────────────────
  const [view, setView] = useState<'entry' | 'history'>('entry');
  const [date, setDate] = useState(today);
  const [customerId, setCustomerId] = useState('');
  const [payment, setPayment] = useState<'Cash' | 'UPI' | 'Credit'>('Cash');
  const [note, setNote] = useState('');
  const [qtys, setQtys] = useState<QtysMap>(makeEmptyQtys);

  // ── Auto-switch payment mode for credit customers ─────────
  const selectedCustomer = useMemo(
    () => customers.find(c => c.id === customerId) ?? null,
    [customers, customerId]
  );

  useEffect(() => {
    if (selectedCustomer?.credit) setPayment('Credit');
    else if (!selectedCustomer) setPayment('Cash');
  }, [selectedCustomer]);

  // ── Per-cell setter ───────────────────────────────────────
  const setQtyField = useCallback(
    (id: string, k: 'qty' | 'rate', v: string) =>
      setQtys(p => ({ ...p, [id]: { ...p[id], [k]: v } })),
    []
  );

  // ── Derived bill lines and total ─────────────────────────
  const lines = useMemo(
    (): BillLine[] =>
      activeItems
        .filter(i => +(qtys[i.id]?.qty || 0) > 0)
        .map(i => ({
          itemId: i.id,
          itemName: i.name,
          qty: +qtys[i.id].qty,
          price: +(qtys[i.id].rate ?? i.price),
          amount: +qtys[i.id].qty * +(qtys[i.id].rate ?? i.price),
        })),
    [qtys, activeItems]
  );

  const total = useMemo(() => lines.reduce((s, l) => s + l.amount, 0), [lines]);

  // ── Payment options ───────────────────────────────────────
  const payOpts = useMemo(
    () =>
      selectedCustomer?.credit
        ? [{ v: 'Credit' as const, l: 'Credit', icon: '📋' }]
        : [
            { v: 'Cash' as const, l: 'Cash', icon: '💵' },
            { v: 'UPI' as const, l: 'UPI', icon: '🏦' },
            { v: 'Credit' as const, l: 'Credit', icon: '📋' },
          ],
    [selectedCustomer]
  );

  // ── Today's billing summary ───────────────────────────────
  const todayBills = useMemo(
    () => bills.filter(b => b.date === today),
    [bills, today]
  );
  const todaySummary = useMemo(
    () => ({
      count: todayBills.length,
      cash: todayBills
        .filter(b => b.payment === 'Cash')
        .reduce((s, b) => s + b.total, 0),
      upi: todayBills
        .filter(b => b.payment === 'UPI')
        .reduce((s, b) => s + b.total, 0),
      credit: todayBills
        .filter(b => b.payment === 'Credit')
        .reduce((s, b) => s + b.total, 0),
    }),
    [todayBills]
  );

  // ── Reset form ────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setDate(today);
    setCustomerId('');
    setPayment('Cash');
    setNote('');
    setQtys(makeEmptyQtys());
  }, [today, makeEmptyQtys]);

  // ── Create bill ───────────────────────────────────────────
  const createBill = useCallback(() => {
    if (!lines.length) {
      showToast('Enter qty for at least one item', 'error');
      return;
    }

    const id = crypto.randomUUID();
    const ref = id.slice(0, 8).toUpperCase(); // short display reference
    const bill: Bill = {
      id,
      date,
      customerId: selectedCustomer?.id ?? null,
      customerName: selectedCustomer?.name ?? '',
      lines,
      payment,
      total,
      note,
    };

    setBills(p => [bill, ...p]);
    syncBill(bill); // ← background sync to Supabase

    // Deduct stock
    lines.forEach(l => {
      setStock(p => ({
        ...p,
        [l.itemId]: { qty: Math.max(0, (p[l.itemId]?.qty ?? 0) - l.qty) },
      }));
    });

    // Update credit ledger if payment is Credit
    if (selectedCustomer && payment === 'Credit') {
      setCustomers(p =>
        p.map(c => {
          if (c.id !== selectedCustomer.id) return c;
          const ledger = c.ledger ?? [];
          const prevBal =
            ledger.length > 0
              ? ledger[ledger.length - 1].balance
              : c.outstanding;
          const newBalance = prevBal + total;
          const desc = lines.map(l => `${l.qty}× ${l.itemName}`).join(', ');
          const updated = {
            ...c,
            credit: true,
            outstanding: newBalance,
            ledger: [
              ...ledger,
              {
                id: crypto.randomUUID(),
                type: 'DEBIT' as const,
                date,
                amount: total,
                description: `Bill ${ref} — ${desc}`,
                balance: newBalance,
              },
            ],
          };
          syncCustomer(updated);
          return updated;
        })
      );
    }

    resetForm();
    setView('history');
    showToast(`✓ Bill ${ref} saved`);
  }, [
    lines,
    date,
    selectedCustomer,
    payment,
    total,
    note,
    bills,
    setBills,
    setStock,
    setCustomers,
    resetForm,
    setView,
    showToast,
  ]);

  return {
    view,
    setView,
    date,
    setDate,
    customerId,
    setCustomerId,
    payment,
    setPayment,
    note,
    setNote,
    qtys,
    setQtyField,
    activeItems,
    stock,
    customers,
    bills,
    lines,
    total,
    selectedCustomer,
    payOpts,
    todaySummary,
    createBill,
    resetForm,
  };
};
