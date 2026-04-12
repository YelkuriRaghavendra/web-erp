import { useState, useMemo, useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useERPStore } from '../../core/store';
import { useToast } from '../../shared/hooks/useToast';
import { syncBill, syncBillUpdate, syncCustomer, syncStock } from '../../core/supabase';
import { ym } from '../../core/constants';
import type { Bill, BillLine } from '../../core/types';

type QtysMap = Record<string, { qty: string; deposit?: string }>;

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
      if (i.prices.length === 0) return false;
      if (i.itemType === 'linked' || i.itemType === 'service') {
        return true;
      }
      return (stock[i.id]?.qty ?? 0) > 0;
    });
  }, [items, stock]);

  // ── Build an empty qty map keyed by item id ───────────────
  const makeEmptyQtys = useCallback((): QtysMap => {
    const q: QtysMap = {};
    activeItems.forEach(i => {
      i.prices.forEach(p => {
        q[`${i.id}-${p.id}`] = { qty: '', deposit: String(p.deposit ?? 0) };
      });
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
    (key: string, field: 'qty' | 'deposit', v: string) =>
      setQtys(p => ({ ...p, [key]: { ...p[key], [field]: v } })),
    []
  );

  // ── Derived bill lines and total ─────────────────────────
  const lines = useMemo(
    (): BillLine[] =>
      activeItems.flatMap(i =>
        i.prices
          .filter(p => +(qtys[`${i.id}-${p.id}`]?.qty || 0) > 0)
          .map(p => {
            const row = qtys[`${i.id}-${p.id}`];
            const dep = row?.deposit !== undefined ? parseFloat(row.deposit) || 0 : (p.deposit ?? 0);
            return {
              itemId: i.id,
              itemName: i.name,
              qty: +(row.qty),
              price: p.price,
              deposit: dep,
              amount: +(row.qty) * p.price,
            };
          })
      ),
    [qtys, activeItems]
  );

  const total = useMemo(() => lines.reduce((s, l) => s + l.amount, 0), [lines]);
  const totalDeposit = useMemo(() => lines.reduce((s, l) => s + l.qty * l.deposit, 0), [lines]);
  const grandTotal = useMemo(() => total + totalDeposit, [total, totalDeposit]);

  // ── Payment options ───────────────────────────────────────
  const payOpts = useMemo(
    () => [
      { v: 'Cash' as const, l: 'Cash', icon: '💵' },
      { v: 'UPI' as const, l: 'UPI', icon: '🏦' },
      { v: 'Credit' as const, l: 'Credit', icon: '📋' },
    ],
    []
  );

  // ── Selected month billing summary ────────────────────────
  const monthBills = useMemo(
    () => bills.filter(b => ym(b.date) === selectedMonth),
    [bills, selectedMonth]
  );
  const monthSummary = useMemo(
    () => {
      const billGrandTotal = (b: Bill) =>
        b.total + b.lines.reduce((ls, l) => ls + l.qty * l.deposit, 0);
      const totalCollected = monthBills.reduce((s, b) => s + billGrandTotal(b), 0);
      const totalDeposits = monthBills.reduce(
        (s, b) => s + b.lines.reduce((ls, l) => ls + l.qty * l.deposit, 0),
        0
      );
      return {
        count: monthBills.length,
        cash: monthBills
          .filter(b => b.payment === 'Cash')
          .reduce((s, b) => s + billGrandTotal(b), 0),
        upi: monthBills
          .filter(b => b.payment === 'UPI')
          .reduce((s, b) => s + billGrandTotal(b), 0),
        credit: monthBills
          .filter(b => b.payment === 'Credit')
          .reduce((s, b) => s + billGrandTotal(b), 0),
        totalDeposits,
        netRevenue: totalCollected - totalDeposits,
      };
    },
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
    // 1. Aggregate qty per item across all price rows
    const qtyPerItem: Record<string, number> = {};
    lines.forEach(l => {
      qtyPerItem[l.itemId] = (qtyPerItem[l.itemId] ?? 0) + l.qty;
    });

    // 2. Validate linked items — check all bundle components have enough stock
    for (const [itemId, totalQty] of Object.entries(qtyPerItem)) {
      const item = items.find(i => i.id === itemId);
      if (item?.itemType !== 'linked') continue;
      for (const comp of item.bundleComponents) {
        // Skip stock check for service components (no stock tracking)
        const compItem = items.find(i => i.id === comp.componentItemId);
        if (compItem?.itemType === 'service') continue;
        const needed = totalQty * comp.qty;
        const available = stock[comp.componentItemId]?.qty ?? 0;
        const directQty = qtyPerItem[comp.componentItemId] ?? 0;
        if (needed + directQty > available) {
          showToast(
            `Not enough ${comp.componentItemName} stock (need ${needed + directQty}, have ${available})`,
            'error'
          );
          return;
        }
      }
    }

    // 3. Validate own-stock items (regular + cylinder)
    const overstock = Object.entries(qtyPerItem).filter(([itemId, totalQty]) => {
      const item = items.find(i => i.id === itemId);
      if (!item || item.itemType === 'linked' || item.itemType === 'service') return false;
      return totalQty > (stock[itemId]?.qty ?? 0);
    });
    if (overstock.length) {
      const names = overstock
        .map(([id]) => items.find(i => i.id === id)?.name ?? id)
        .join(', ');
      showToast(`Insufficient stock for: ${names}`, 'error');
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

    setStock(p => {
      const updated = { ...p };
      const qtyPerItem2: Record<string, number> = {};
      lines.forEach(l => {
        qtyPerItem2[l.itemId] = (qtyPerItem2[l.itemId] ?? 0) + l.qty;
      });

      for (const [itemId, totalQty] of Object.entries(qtyPerItem2)) {
        const item = items.find(i => i.id === itemId);
        if (item?.itemType === 'service') continue; // no stock to deduct
        if (item?.itemType === 'linked') {
          item.bundleComponents.forEach(comp => {
            const deductQty = totalQty * comp.qty;
            updated[comp.componentItemId] = {
              qty: Math.max(0, (updated[comp.componentItemId]?.qty ?? 0) - deductQty),
            };
          });
        } else {
          updated[itemId] = {
            qty: Math.max(0, (updated[itemId]?.qty ?? 0) - totalQty),
          };
        }
      }
      syncStock(updated);
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
    setBills(prev => prev.map(b => b.id === newBill.id ? newBill : b));

    setStock(prevStock => {
      const s = { ...prevStock };

      const aggregateQty = (billLines: BillLine[]): Record<string, number> => {
        const map: Record<string, number> = {};
        billLines.forEach(l => { map[l.itemId] = (map[l.itemId] ?? 0) + l.qty; });
        return map;
      };

      // Restore stock from old bill
      const oldQtyMap = aggregateQty(oldBill.lines);
      for (const [itemId, qty] of Object.entries(oldQtyMap)) {
        const item = items.find(i => i.id === itemId);
        if (item?.itemType === 'service') continue;
        if (item?.itemType === 'linked') {
          item.bundleComponents.forEach(comp => {
            s[comp.componentItemId] = { qty: (s[comp.componentItemId]?.qty ?? 0) + qty * comp.qty };
          });
        } else {
          s[itemId] = { qty: (s[itemId]?.qty ?? 0) + qty };
        }
      }

      // Deduct stock for new bill
      const newQtyMap = aggregateQty(newBill.lines);
      for (const [itemId, qty] of Object.entries(newQtyMap)) {
        const item = items.find(i => i.id === itemId);
        if (item?.itemType === 'service') continue;
        if (item?.itemType === 'linked') {
          item.bundleComponents.forEach(comp => {
            s[comp.componentItemId] = { qty: Math.max(0, (s[comp.componentItemId]?.qty ?? 0) - qty * comp.qty) };
          });
        } else {
          s[itemId] = { qty: Math.max(0, (s[itemId]?.qty ?? 0) - qty) };
        }
      }

      syncStock(s);
      return s;
    });

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
    totalDeposit,
    grandTotal,
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
