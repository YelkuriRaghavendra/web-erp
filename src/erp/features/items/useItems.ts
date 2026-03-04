import { useState, useMemo, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useERPStore } from '../../core/store';
import { useToast } from '../../shared/hooks/useToast';
import { isCylinder } from '../../core/constants';
import { syncItems, syncStock } from '../../core/supabase';

type Filter = 'all' | 'active' | 'inactive';
const EMPTY_FORM = { name: '', unit: 'Piece', price: '0' };

export const useItems = () => {
  const { items, stock, setItems, setStock } = useERPStore(
    useShallow(s => ({ items: s.items, stock: s.stock, setItems: s.setItems, setStock: s.setStock })),
  );
  const showToast = useToast();

  // ── UI state ──────────────────────────────────────────────
  const [filter, setFilter]       = useState<Filter>('all');
  const [addModal, setAddModal]   = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [editId, setEditId]       = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');

  // Stock-adjust modal (replaces window.prompt)
  const [adjustItem, setAdjustItem] = useState<string | null>(null);
  const [adjustQty, setAdjustQty]   = useState('');

  const setField = useCallback(
    (k: keyof typeof EMPTY_FORM, v: string) =>
      setForm((p) => ({ ...p, [k]: v })),
    [],
  );

  // ── Derived item lists ────────────────────────────────────
  const passes = useCallback(
    (active: boolean) =>
      filter === 'all'
        ? true
        : filter === 'active'
        ? active
        : !active,
    [filter],
  );

  const cylItems = useMemo(
    () => items.filter((i) => isCylinder(i.name) && passes(i.active)),
    [items, passes],
  );

  const otherItems = useMemo(
    () => items.filter((i) => !isCylinder(i.name) && passes(i.active)),
    [items, passes],
  );

  const inventoryValue = useMemo(
    () => items.filter((i) => i.active).reduce((s, it) => s + (stock[it.id]?.qty ?? 0) * it.price, 0),
    [items, stock],
  );

  // ── Price editing ─────────────────────────────────────────
  const startEditPrice = useCallback((id: string, currentPrice: number) => {
    setEditId(id);
    setEditPrice(String(currentPrice));
  }, []);

  const savePrice = useCallback(() => {
    if (editId === null) return;
    setItems((p) => {
      const updated = p.map((it) => (it.id === editId ? { ...it, price: +editPrice } : it));
      syncItems(updated);
      return updated;
    });
    setEditId(null);
    showToast('Price updated');
  }, [editId, editPrice, setItems, showToast]);

  const cancelEditPrice = useCallback(() => setEditId(null), []);

  // ── Toggle active ─────────────────────────────────────────
  const toggleItem = useCallback(
    (id: string) => {
      setItems((p) => {
        const updated = p.map((it) => (it.id === id ? { ...it, active: !it.active } : it));
        syncItems(updated);
        return updated;
      });
    },
    [setItems],
  );

  // ── Stock adjust modal ────────────────────────────────────
  const openAdjust = useCallback(
    (id: string) => {
      setAdjustItem(id);
      setAdjustQty(String(stock[id]?.qty ?? 0));
    },
    [stock],
  );

  const saveAdjust = useCallback(() => {
    if (adjustItem === null) return;
    if (adjustQty === '' || isNaN(+adjustQty)) {
      showToast('Enter a valid quantity', 'error');
      return;
    }
    setStock((p) => {
      const updated = { ...p, [adjustItem!]: { qty: Math.max(0, +adjustQty) } };
      syncStock(updated);
      return updated;
    });
    setAdjustItem(null);
    showToast('Stock updated');
  }, [adjustItem, adjustQty, setStock, showToast]);

  const closeAdjust = useCallback(() => setAdjustItem(null), []);

  // ── Add new item ──────────────────────────────────────────
  const addItem = useCallback(() => {
    if (!form.name.trim()) { showToast('Name required', 'error'); return; }
    const newId = crypto.randomUUID();
    setItems((p) => {
      const updated = [...p, { id: newId, name: form.name, unit: form.unit, price: +form.price, active: true }];
      syncItems(updated);
      return updated;
    });
    setStock((p) => {
      const updated = { ...p, [newId]: { qty: 0 } };
      syncStock(updated);
      return updated;
    });
    setAddModal(false);
    setForm(EMPTY_FORM);
    showToast('Item added');
  }, [form, setItems, setStock, showToast]);

  // The item being adjusted (for label in modal)
  const adjustItemData = useMemo(
    () => (adjustItem ? items.find((i) => i.id === adjustItem) ?? null : null),
    [adjustItem, items],
  );

  return {
    items,
    stock,
    // filters
    filter, setFilter,
    cylItems, otherItems,
    inventoryValue,
    // add modal
    addModal, setAddModal,
    form, setField,
    addItem,
    // price editing
    editId, editPrice, setEditPrice,
    startEditPrice, savePrice, cancelEditPrice,
    // toggle
    toggleItem,
    // stock adjust modal
    adjustItem, adjustItemData,
    adjustQty, setAdjustQty,
    openAdjust, saveAdjust, closeAdjust,
  };
};
