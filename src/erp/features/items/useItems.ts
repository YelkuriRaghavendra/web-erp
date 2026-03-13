import { useState, useMemo, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useERPStore } from '../../core/store';
import { useToast } from '../../shared/hooks/useToast';
import { syncItems, syncStock, insertItem, insertStockRow } from '../../core/supabase';
import type { ItemType } from '../../core/types';

type Filter = 'all' | 'active' | 'inactive';

// Form state for "Add New Item" modal
interface AddForm {
  name: string;
  unit: string;
  price: string;
  itemType: ItemType;
  stockSourceId: string; // empty string = null
}

const EMPTY_FORM: AddForm = {
  name: '',
  unit: 'Piece',
  price: '0',
  itemType: 'regular',
  stockSourceId: '',
};

export const useItems = () => {
  const { items, stock, setItems, setStock } = useERPStore(
    useShallow(s => ({
      items: s.items,
      stock: s.stock,
      setItems: s.setItems,
      setStock: s.setStock,
    }))
  );
  const showToast = useToast();

  // ── UI state ──────────────────────────────────────────────
  const [filter, setFilter] = useState<Filter>('all');
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState<AddForm>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');

  // Stock-adjust modal
  const [adjustItem, setAdjustItem] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState('');

  const setField = useCallback(
    <K extends keyof AddForm>(k: K, v: AddForm[K]) =>
      setForm(p => ({ ...p, [k]: v })),
    []
  );

  // Reset stockSourceId when item type changes away from 'linked'
  const setItemType = useCallback((v: ItemType) => {
    setForm(p => ({
      ...p,
      itemType: v,
      stockSourceId: v === 'linked' ? p.stockSourceId : '',
    }));
  }, []);

  // ── Derived item lists — keyed by itemType, not by name ───
  const passes = useCallback(
    (active: boolean) =>
      filter === 'all' ? true : filter === 'active' ? active : !active,
    [filter]
  );

  // Cylinders — shown in the card-grid section
  const cylItems = useMemo(
    () => items.filter(i => i.itemType === 'cylinder' && passes(i.active)),
    [items, passes]
  );

  // Linked items (e.g. New Connection) — shown in the table with a badge
  const linkedItems = useMemo(
    () => items.filter(i => i.itemType === 'linked' && passes(i.active)),
    [items, passes]
  );

  // Regular items — everything else
  const otherItems = useMemo(
    () => items.filter(i => i.itemType === 'regular' && passes(i.active)),
    [items, passes]
  );

  // All cylinder items (regardless of filter) — used as source options
  // in the "Add Item" modal's stock source dropdown.
  const allCylinderItems = useMemo(
    () => items.filter(i => i.itemType === 'cylinder' && i.active),
    [items]
  );

  const inventoryValue = useMemo(
    () =>
      items
        .filter(i => i.active)
        .reduce((s, it) => s + (stock[it.id]?.qty ?? 0) * it.price, 0),
    [items, stock]
  );

  // ── Price editing ─────────────────────────────────────────
  const startEditPrice = useCallback((id: string, currentPrice: number) => {
    setEditId(id);
    setEditPrice(String(currentPrice));
  }, []);

  const savePrice = useCallback(() => {
    if (editId === null) return;
    setItems(p => {
      const updated = p.map(it =>
        it.id === editId ? { ...it, price: +editPrice } : it
      );
      syncItems(updated);
      return updated;
    });
    setEditId(null);
    showToast('Price updated');
  }, [editId, editPrice, setItems, showToast]);

  const cancelEditPrice = useCallback(() => setEditId(null), []);

  // ── Toggle active (with confirmation guard) ───────────────
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);

  const requestToggle = useCallback((id: string) => {
    setPendingToggleId(id);
  }, []);

  const confirmToggle = useCallback(() => {
    if (pendingToggleId === null) return;
    const id = pendingToggleId;
    setItems(p => {
      const updated = p.map(it =>
        it.id === id ? { ...it, active: !it.active } : it
      );
      syncItems(updated);
      return updated;
    });
    setPendingToggleId(null);
  }, [pendingToggleId, setItems]);

  const cancelToggle = useCallback(() => setPendingToggleId(null), []);

  const toggleItem = useCallback(
    (id: string) => {
      setItems(p => {
        const updated = p.map(it =>
          it.id === id ? { ...it, active: !it.active } : it
        );
        syncItems(updated);
        return updated;
      });
    },
    [setItems]
  );

  const pendingToggleItem = useMemo(
    () => (pendingToggleId ? (items.find(i => i.id === pendingToggleId) ?? null) : null),
    [pendingToggleId, items]
  );

  // ── Stock adjust modal ────────────────────────────────────
  const openAdjust = useCallback(
    (id: string) => {
      setAdjustItem(id);
      setAdjustQty(String(stock[id]?.qty ?? 0));
    },
    [stock]
  );

  const saveAdjust = useCallback(() => {
    if (adjustItem === null) return;
    if (adjustQty === '' || isNaN(+adjustQty)) {
      showToast('Enter a valid quantity', 'error');
      return;
    }
    setStock(p => {
      const updated = { ...p, [adjustItem!]: { qty: Math.max(0, +adjustQty) } };
      syncStock(updated);
      return updated;
    });
    setAdjustItem(null);
    showToast('Stock updated');
  }, [adjustItem, adjustQty, setStock, showToast]);

  const closeAdjust = useCallback(() => setAdjustItem(null), []);

  // ── Link / Unlink item ────────────────────────────────────
  const [linkEditId, setLinkEditId] = useState<string | null>(null);
  const [linkEditSourceId, setLinkEditSourceId] = useState('');

  const openLinkEdit = useCallback(
    (id: string) => {
      const item = items.find(i => i.id === id);
      setLinkEditId(id);
      setLinkEditSourceId(item?.stockSourceId ?? '');
    },
    [items]
  );

  const saveLinkEdit = useCallback(
    (sourceId: string) => {
      if (!linkEditId) return;
      if (!sourceId) {
        showToast('Select a stock source', 'error');
        return;
      }
      setItems(p => {
        const updated = p.map(it =>
          it.id === linkEditId
            ? { ...it, itemType: 'linked' as const, stockSourceId: sourceId }
            : it
        );
        syncItems(updated);
        return updated;
      });
      setLinkEditId(null);
      showToast('Item linked to stock source');
    },
    [linkEditId, setItems, showToast]
  );

  const unlinkItem = useCallback(
    (id: string) => {
      setItems(p => {
        const updated = p.map(it =>
          it.id === id
            ? { ...it, itemType: 'regular' as const, stockSourceId: null }
            : it
        );
        syncItems(updated);
        return updated;
      });
      showToast('Item unlinked');
    },
    [setItems, showToast]
  );

  const closeLinkEdit = useCallback(() => setLinkEditId(null), []);

  // ── Add new item (async — DB generates bigserial ID) ─────
  const addItem = useCallback(async () => {
    if (!form.name.trim()) {
      showToast('Name required', 'error');
      return;
    }
    if (form.itemType === 'linked' && !form.stockSourceId) {
      showToast('Select a stock source for this linked item', 'error');
      return;
    }
    try {
      const stockSourceId =
        form.itemType === 'linked' && form.stockSourceId
          ? form.stockSourceId
          : null;

      const newId = await insertItem({
        name: form.name,
        unit: form.unit,
        price: +form.price,
        active: true,
        itemType: form.itemType,
        stockSourceId,
      });
      await insertStockRow(newId);

      setItems(p => [
        ...p,
        {
          id: newId,
          name: form.name,
          unit: form.unit,
          price: +form.price,
          active: true,
          itemType: form.itemType,
          stockSourceId,
        },
      ]);
      setStock(p => ({ ...p, [newId]: { qty: 0 } }));
      setAddModal(false);
      setForm(EMPTY_FORM);
      showToast('Item added');
    } catch (err) {
      console.warn('[addItem]', err);
      showToast('Failed to add item', 'error');
    }
  }, [form, setItems, setStock, showToast]);

  const adjustItemData = useMemo(
    () => (adjustItem ? (items.find(i => i.id === adjustItem) ?? null) : null),
    [adjustItem, items]
  );

  return {
    items,
    stock,
    // filters
    filter,
    setFilter,
    cylItems,
    linkedItems,
    otherItems,
    allCylinderItems,
    inventoryValue,
    // add modal
    addModal,
    setAddModal,
    form,
    setField,
    setItemType,
    addItem,
    // price editing
    editId,
    editPrice,
    setEditPrice,
    startEditPrice,
    savePrice,
    cancelEditPrice,
    // toggle
    toggleItem,
    pendingToggleId,
    pendingToggleItem,
    requestToggle,
    confirmToggle,
    cancelToggle,
    // stock adjust modal
    adjustItem,
    adjustItemData,
    adjustQty,
    setAdjustQty,
    openAdjust,
    saveAdjust,
    closeAdjust,
    // link / unlink
    linkEditId,
    linkEditSourceId,
    setLinkEditSourceId,
    openLinkEdit,
    saveLinkEdit,
    unlinkItem,
    closeLinkEdit,
  };
};
