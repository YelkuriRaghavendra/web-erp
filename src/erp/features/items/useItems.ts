import { useState, useMemo, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useERPStore } from '../../core/store';
import { useToast } from '../../shared/hooks/useToast';
import { syncItems, syncStock, insertItem, insertStockRow, deleteItem as dbDeleteItem } from '../../core/supabase';
import type { ItemType } from '../../core/types';

type Filter = 'all' | 'active' | 'inactive';

// Form state for "Add New Item" modal
interface AddForm {
  name: string;
  unit: string;
  prices: { price: string; deposit: string }[];
  itemType: ItemType;
}

const EMPTY_FORM: AddForm = {
  name: '',
  unit: 'Piece',
  prices: [{ price: '0', deposit: '0' }],
  itemType: 'regular',
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

  // Stock-adjust modal
  const [adjustItem, setAdjustItem] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState('');

  const setField = useCallback(
    <K extends keyof AddForm>(k: K, v: AddForm[K]) =>
      setForm(p => ({ ...p, [k]: v })),
    []
  );

  // Reset item type
  const setItemType = useCallback((v: ItemType) => {
    setForm(p => ({
      ...p,
      itemType: v,
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

  // Regular + Service items — everything that's not cylinder or linked
  const otherItems = useMemo(
    () => items.filter(i => (i.itemType === 'regular' || i.itemType === 'service') && passes(i.active)),
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
        .reduce((s, it) => s + (stock[it.id]?.qty ?? 0) * (it.prices[0]?.price ?? 0), 0),
    [items, stock]
  );

  // ── Multi-price management ────────────────────────────────
  const savePrices = useCallback(
    (id: string, newPrices: import('../../core/types').ItemPrice[]) => {
      setItems(prev => {
        const updated = prev.map(i => (i.id === id ? { ...i, prices: newPrices } : i));
        syncItems(updated.filter(i => i.id === id));
        return updated;
      });
    },
    [setItems]
  );

  // ── Bundle component management ───────────────────────────
  const saveBundleComponents = useCallback(
    (id: string, components: import('../../core/types').BundleComponent[]) => {
      setItems(prev => {
        const updated = prev.map(i => (i.id === id ? { ...i, bundleComponents: components } : i));
        syncItems(updated.filter(i => i.id === id));
        return updated;
      });
    },
    [setItems]
  );

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

  // ── Delete item ──────────────────────────────────────────
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const requestDelete = useCallback((id: string) => {
    setPendingDeleteId(id);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (pendingDeleteId === null) return;
    const id = pendingDeleteId;
    try {
      await dbDeleteItem(id);
      setItems(p => p.filter(it => it.id !== id));
      setStock(p => {
        const updated = { ...p };
        delete updated[id];
        return updated;
      });
      showToast('Item deleted');
    } catch (err) {
      console.warn('[deleteItem]', err);
      showToast('Failed to delete — item may be referenced in bills', 'error');
    }
    setPendingDeleteId(null);
  }, [pendingDeleteId, setItems, setStock, showToast]);

  const cancelDelete = useCallback(() => setPendingDeleteId(null), []);

  const pendingDeleteItem = useMemo(
    () => (pendingDeleteId ? (items.find(i => i.id === pendingDeleteId) ?? null) : null),
    [pendingDeleteId, items]
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
      setLinkEditSourceId(item?.bundleComponents[0]?.componentItemId ?? '');
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
      const sourceName = items.find(i => i.id === sourceId)?.name ?? 'Unknown';
      setItems(p => {
        const updated = p.map(it =>
          it.id === linkEditId
            ? {
                ...it,
                itemType: 'linked' as const,
                bundleComponents: [{
                  id: `link-${Date.now()}`,
                  componentItemId: sourceId,
                  componentItemName: sourceName,
                  qty: 1,
                }],
              }
            : it
        );
        syncItems(updated.filter(i => i.id === linkEditId));
        return updated;
      });
      setLinkEditId(null);
      showToast('Item linked to stock source');
    },
    [linkEditId, items, setItems, showToast]
  );

  const unlinkItem = useCallback(
    (id: string) => {
      setItems(p => {
        const updated = p.map(it =>
          it.id === id
            ? { ...it, itemType: 'regular' as const, bundleComponents: [] }
            : it
        );
        syncItems(updated.filter(i => i.id === id));
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
    const parsedPrices = form.prices
      .map(p => ({ price: parseFloat(p.price), deposit: parseFloat(p.deposit) || 0 }))
      .filter(p => !isNaN(p.price) && p.price >= 0);
    if (parsedPrices.length === 0) {
      showToast('At least one valid price is required', 'error');
      return;
    }
    try {
      const newId = await insertItem({
        name: form.name,
        unit: form.unit,
        prices: parsedPrices.map((p, idx) => ({
          id: `temp-${idx}`,
          price: p.price,
          deposit: p.deposit,
          sortOrder: idx,
        })),
        active: true,
        itemType: form.itemType,
        bundleComponents: [],
      });
      await insertStockRow(newId);

      setItems(p => [
        ...p,
        {
          id: newId,
          name: form.name,
          unit: form.unit,
          prices: parsedPrices.map((p, idx) => ({
            id: `temp-${idx}`,
            price: p.price,
            deposit: p.deposit,
            sortOrder: idx,
          })),
          active: true,
          itemType: form.itemType,
          bundleComponents: [],
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
    savePrices,
    saveBundleComponents,
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
    // delete
    pendingDeleteId,
    pendingDeleteItem,
    requestDelete,
    confirmDelete,
    cancelDelete,
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
