import { useState, useMemo, useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useERPStore } from '../../core/store';
import { useToast } from '../../shared/hooks/useToast';
import { syncBill, syncBillUpdate, syncCustomer, syncStock } from '../../core/supabase';
import { ym } from '../../core/constants';
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
  const thisMonth = today.slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(thisMonth);

  const prevMonth = useCallback(() => {
    setSelectedMonth(prev => {
      const [y, m] = prev.split('-').map(Number);
      const d = new Date(y, m - 2, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setSelectedMonth(prev => {
      const [y, m] = prev.split('-').map(Number);
      const d = new Date(y, m, 1);
      const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return next <= thisMonth ? next : prev;
    });
  }, [thisMonth]);

  // Active items for billing (data-driven — no name regex):
  //   'regular' / 'cylinder' → show when their own stock > 0
  //   'linked'               → show when their stockSourceId item has stock > 0
  const activeItems = useMemo(() => {
    return items.filter(i => {
      if (!i.active) return false;
      if (i.itemType === 'linked') {
        // Draw stock from the source item
        const srcQty = i.stockSourceId ? (stock[i.stockSourceId]?.qty ?? 0) : 0;
        return srcQty > 0;
      }
      return (stock[i.id]?.qty ?? 0) > 0;
    });
  }, [items, stock]);

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

  // ── Selected month billing summary ────────────────────────
  const monthBills = useMemo(
    () => bills.filter(b => ym(b.date) === selectedMonth),
    [bills, selectedMonth]
  );
  const monthSummary = useMemo(
    () => ({
      count: monthBills.length,
      cash: monthBills
        .filter(b => b.payment === 'Cash')
        .reduce((s, b) => s + b.total, 0),
      upi: monthBills
        .filter(b => b.payment === 'UPI')
        .reduce((s, b) => s + b.total, 0),
      credit: monthBills
        .filter(b => b.payment === 'Credit')
        .reduce((s, b) => s + b.total, 0),
    }),
    [monthBills]
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

    // ── Stock validation — fully data-driven ─────────────────
    // 1. Group 'linked' item lines by their stockSourceId to check
    //    whether the source item has enough stock.
    const linkedDeductions: Record<string, number> = {};
    lines.forEach(l => {
      const item = items.find(i => i.id === l.itemId);
      if (item?.itemType === 'linked' && item.stockSourceId) {
        linkedDeductions[item.stockSourceId] =
          (linkedDeductions[item.stockSourceId] ?? 0) + l.qty;
      }
    });

    for (const [srcId, neededQty] of Object.entries(linkedDeductions)) {
      const srcItem = items.find(i => i.id === srcId);
      const available = stock[srcId]?.qty ?? 0;
      // Also count any direct lines for the source item in this same bill
      const directQty = lines
        .filter(l => l.itemId === srcId)
        .reduce((s, l) => s + l.qty, 0);
      if (neededQty + directQty > available) {
        showToast(
          `Not enough ${srcItem?.name ?? 'source'} stock — need ${neededQty + directQty}, have ${available}`,
          'error'
        );
        return;
      }
    }

    // 2. Validate own-stock items (regular + cylinder)
    const overstock = lines.filter(l => {
      const item = items.find(i => i.id === l.itemId);
      if (!item || item.itemType === 'linked') return false;
      return l.qty > (stock[l.itemId]?.qty ?? 0);
    });
    if (overstock.length) {
      const first = overstock[0];
      showToast(
        `Not enough stock — ${first.itemName}: only ${stock[first.itemId]?.qty ?? 0} available, entered ${first.qty}`,
        'error'
      );
      return;
    }

    // Generate friendly sequential ID: INV-YYMMDD-NNN
    const dateStr = date.replace(/-/g, '').slice(2); // "YYMMDD"
    const dayCount = bills.filter(b => b.date === date).length + 1;
    const id = `INV-${dateStr}-${String(dayCount).padStart(3, '0')}`;
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

    // ── Stock deduction — data-driven ─────────────────────────
    // 'linked' items deduct from their stockSourceId.
    // All other items deduct from their own stock.
    setStock(p => {
      const updated = { ...p };
      lines.forEach(l => {
        const item = items.find(i => i.id === l.itemId);
        const deductFrom =
          item?.itemType === 'linked' && item.stockSourceId
            ? item.stockSourceId
            : l.itemId;
        updated[deductFrom] = {
          qty: Math.max(0, (updated[deductFrom]?.qty ?? 0) - l.qty),
        };
      });
      syncStock(updated); // ← persist updated stock to Supabase
      return updated;
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
                description: `Bill ${id} — ${desc}`,
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
    showToast(`✓ Bill ${id} saved`, 'success');
  }, [
    lines,
    items,
    stock,
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

  // ── Update an existing bill (admin only) ─────────────────
  const updateBill = useCallback((oldBill: Bill, newBill: Bill) => {
    // 1. Replace bill in store
    setBills(prev => prev.map(b => b.id === newBill.id ? newBill : b));

    // 2. Adjust stock: restore old deductions, apply new ones
    setStock(prevStock => {
      const s = { ...prevStock };
      // Restore stock from old bill
      oldBill.lines.forEach(l => {
        const item = items.find(i => i.id === l.itemId);
        const src = item?.itemType === 'linked' && item.stockSourceId ? item.stockSourceId : l.itemId;
        s[src] = { qty: (s[src]?.qty ?? 0) + l.qty };
      });
      // Deduct stock for new bill
      newBill.lines.forEach(l => {
        const item = items.find(i => i.id === l.itemId);
        const src = item?.itemType === 'linked' && item.stockSourceId ? item.stockSourceId : l.itemId;
        s[src] = { qty: Math.max(0, (s[src]?.qty ?? 0) - l.qty) };
      });
      syncStock(s);
      return s;
    });

    // 3. Sync to Supabase
    syncBillUpdate(newBill);
    showToast(`✓ Bill ${newBill.id} updated`, 'success');
  }, [items, setBills, setStock, showToast]);

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
    selectedMonth,
    prevMonth,
    nextMonth,
    monthSummary,
    createBill,
    updateBill,
    resetForm,
  };
};
