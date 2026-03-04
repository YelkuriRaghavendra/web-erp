import { useState, useMemo, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useERPStore } from '../../core/store';
import { useToast } from '../../shared/hooks/useToast';
import { syncPurchase } from '../../core/supabase';
import type { Purchase, PurchaseLine } from '../../core/types';

type RowsMap = Record<string, { qty: string; rate: string }>;

export const usePurchase = () => {
  const { items, stock, purchases, setPurchases, setStock } = useERPStore(
    useShallow(s => ({
      items: s.items,
      stock: s.stock,
      purchases: s.purchases,
      setPurchases: s.setPurchases,
      setStock: s.setStock,
    }))
  );
  const showToast = useToast();

  const activeItems = useMemo(() => items.filter(i => i.active), [items]);

  const makeEmptyRows = useCallback((): RowsMap => {
    const r: RowsMap = {};
    activeItems.forEach(i => {
      r[i.id] = { qty: '', rate: '' };
    });
    return r;
  }, [activeItems]);

  // ── Form state ────────────────────────────────────────────
  const [view, setView] = useState<'entry' | 'history'>('entry');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [rows, setRows] = useState<RowsMap>(makeEmptyRows);

  // ── Per-cell setter ───────────────────────────────────────
  const setRowField = useCallback(
    (id: string, k: 'qty' | 'rate', v: string) =>
      setRows(p => ({ ...p, [id]: { ...p[id], [k]: v } })),
    []
  );

  // ── Derived lines and total ───────────────────────────────
  const lines = useMemo(
    (): PurchaseLine[] =>
      activeItems
        .filter(i => +(rows[i.id]?.qty || 0) > 0)
        .map(i => ({
          itemId: i.id,
          itemName: i.name,
          qty: +rows[i.id].qty,
          rate: +(rows[i.id].rate || 0),
          total: +rows[i.id].qty * +(rows[i.id].rate || 0),
        })),
    [rows, activeItems]
  );

  const grandTotal = useMemo(
    () => lines.reduce((s, l) => s + l.total, 0),
    [lines]
  );

  // ── All-time stats ────────────────────────────────────────
  const stats = useMemo(
    () => ({
      totalOrders: purchases.length,
      totalQty: purchases.reduce(
        (s, p) => s + p.lines.reduce((ss, l) => ss + l.qty, 0),
        0
      ),
      totalSpend: purchases.reduce((s, p) => s + p.grandTotal, 0),
    }),
    [purchases]
  );

  // ── Reset form ────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setDate(new Date().toISOString().slice(0, 10));
    setNote('');
    setRows(makeEmptyRows());
  }, [makeEmptyRows]);

  // ── Record purchase ───────────────────────────────────────
  const recordPurchase = useCallback(() => {
    if (!lines.length) {
      showToast('Enter qty for at least one item', 'error');
      return;
    }

    const id = crypto.randomUUID();
    const ref = id.slice(0, 8).toUpperCase(); // short display reference
    const po: Purchase = { id, date, note, grandTotal, lines };

    setPurchases(p => [po, ...p]);
    syncPurchase(po); // ← background sync to Supabase

    lines.forEach(l => {
      setStock(p => ({
        ...p,
        [l.itemId]: { qty: (p[l.itemId]?.qty ?? 0) + l.qty },
      }));
    });

    resetForm();
    setView('history');
    showToast(`✓ Purchase ${ref} recorded`);
  }, [
    lines,
    date,
    note,
    grandTotal,
    purchases,
    setPurchases,
    setStock,
    resetForm,
    setView,
    showToast,
  ]);

  return {
    view,
    setView,
    date,
    setDate,
    note,
    setNote,
    rows,
    setRowField,
    activeItems,
    stock,
    purchases,
    lines,
    grandTotal,
    stats,
    recordPurchase,
    resetForm,
  };
};
