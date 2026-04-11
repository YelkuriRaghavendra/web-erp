import { useState } from 'react';
import { Btn, Field, Modal, Badge } from '../../shared/components/ui';
import { useItems } from './useItems';
import type { ItemType, ItemPrice } from '../../core/types';

// Human-readable labels for itemType values
const TYPE_LABELS: Record<ItemType, string> = {
  regular: 'Regular',
  cylinder: 'Cylinder',
  linked: 'Linked',
};
const TYPE_BADGE_COLOR: Record<ItemType, 'orange' | 'blue' | 'purple'> = {
  regular: 'orange',
  cylinder: 'blue',
  linked: 'purple',
};

export const ItemMasterPage = () => {
  const {
    items,
    stock,
    filter,
    setFilter,
    cylItems,
    linkedItems,
    otherItems,
    allCylinderItems,
    inventoryValue,
    addModal,
    setAddModal,
    form,
    setField,
    setItemType,
    addItem,
    savePrices,
    // saveBundleComponents — available for future bundle component UI
    toggleItem,
    pendingToggleItem,
    requestToggle,
    confirmToggle,
    cancelToggle,
    adjustItem,
    adjustItemData,
    adjustQty,
    setAdjustQty,
    openAdjust,
    saveAdjust,
    closeAdjust,
    linkEditId,
    linkEditSourceId,
    setLinkEditSourceId,
    openLinkEdit,
    saveLinkEdit,
    unlinkItem,
    closeLinkEdit,
  } = useItems();

  // ── Inline price editing state ────────────────────────────
  const [editingPricesId, setEditingPricesId] = useState<string | null>(null);
  const [editingPricesValues, setEditingPricesValues] = useState<{ price: string; deposit: string }[]>([]);

  const startEditPrices = (id: string, currentPrices: ItemPrice[]) => {
    setEditingPricesId(id);
    setEditingPricesValues(currentPrices.map(p => ({ price: String(p.price), deposit: String(p.deposit ?? 0) })));
  };

  const cancelEditPrices = () => {
    setEditingPricesId(null);
    setEditingPricesValues([]);
  };

  const saveEditedPrices = (id: string) => {
    const parsed = editingPricesValues
      .map(v => ({ price: parseFloat(v.price), deposit: parseFloat(v.deposit) || 0 }))
      .filter(v => !isNaN(v.price) && v.price >= 0);
    if (parsed.length === 0) return;
    savePrices(
      id,
      parsed.map((p, idx) => ({ id: `p-${Date.now()}-${idx}`, price: p.price, deposit: p.deposit, sortOrder: idx }))
    );
    setEditingPricesId(null);
    setEditingPricesValues([]);
  };

  // ── Shared table row renderer ─────────────────────────────
  const renderTableRow = (item: (typeof otherItems)[0], idx: number, arr: typeof otherItems) => {
    const qty = stock[item.id]?.qty ?? 0;
    const primaryPrice = item.prices[0]?.price ?? 0;
    const val = qty * primaryPrice;
    const isEditing = editingPricesId === item.id;
    const srcItem =
      item.itemType === 'linked' && item.bundleComponents.length > 0
        ? items.find(i => i.id === item.bundleComponents[0].componentItemId)
        : null;

    return (
      <tr
        key={item.id}
        style={{
          borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none',
          opacity: item.active ? 1 : 0.55,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <td style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: item.active ? 'var(--ink)' : 'var(--ink3)',
                }}
              >
                {item.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 2 }}>
                ID #{item.id} · {item.unit}
                {srcItem && (
                  <span
                    style={{
                      marginLeft: 6,
                      color: 'var(--purple)',
                      fontWeight: 700,
                    }}
                  >
                    ← stock from {srcItem.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </td>
        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
          <Badge
            label={TYPE_LABELS[item.itemType]}
            color={TYPE_BADGE_COLOR[item.itemType]}
          />
        </td>
        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
          {isEditing ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                alignItems: 'flex-end',
              }}
            >
              {editingPricesValues.map((pv, pi) => (
                <div key={pi} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--ink3)' }}>₹</span>
                  <input
                    type='number'
                    value={pv.price}
                    onChange={e => {
                      const next = [...editingPricesValues];
                      next[pi] = { ...next[pi], price: e.target.value };
                      setEditingPricesValues(next);
                    }}
                    autoFocus={pi === 0}
                    style={{
                      width: 80,
                      background: 'var(--canvas)',
                      border: '2px solid var(--accent)',
                      borderRadius: 7,
                      padding: '5px 8px',
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono',monospace",
                      outline: 'none',
                      textAlign: 'right',
                      color: 'var(--ink)',
                    }}
                  />
                  <input
                    type='number'
                    placeholder='Deposit'
                    value={pv.deposit}
                    onChange={e => {
                      const next = [...editingPricesValues];
                      next[pi] = { ...next[pi], deposit: e.target.value };
                      setEditingPricesValues(next);
                    }}
                    style={{
                      width: 80, padding: '6px 10px', background: 'var(--bg)',
                      border: '1px solid var(--border2)', borderRadius: 6,
                      fontSize: 13, fontFamily: "'JetBrains Mono',monospace",
                      fontWeight: 600, color: 'var(--amber)', outline: 'none',
                    }}
                  />
                  {editingPricesValues.length > 1 && (
                    <button
                      onClick={() => setEditingPricesValues(prev => prev.filter((_, j) => j !== pi))}
                      style={{
                        padding: '2px 6px', borderRadius: 5, border: '1px solid var(--border2)',
                        background: 'transparent', color: 'var(--ink3)', fontSize: 11,
                        cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif",
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => setEditingPricesValues(prev => [...prev, { price: '0', deposit: '0' }])}
                  style={{
                    padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border2)',
                    background: 'transparent', color: 'var(--accent)', fontSize: 11,
                    fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif",
                  }}
                >
                  + Price
                </button>
                <button
                  onClick={() => saveEditedPrices(item.id)}
                  style={{
                    padding: '5px 9px', borderRadius: 6, border: 'none',
                    background: 'var(--accent)', color: '#fff', fontSize: 12,
                    fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif",
                  }}
                >
                  ✓
                </button>
                <button
                  onClick={cancelEditPrices}
                  style={{
                    padding: '5px 9px', borderRadius: 6, border: '1px solid var(--border2)',
                    background: 'transparent', color: 'var(--ink3)', fontSize: 11,
                    cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontWeight: 700,
                  fontSize: 14,
                  color: primaryPrice > 0 ? 'var(--ink)' : 'var(--ink3)',
                }}
              >
                {item.prices.length > 0
                  ? item.prices.map(p => `₹${p.price.toLocaleString()}`).join(', ')
                  : 'Free'}
              </span>
              <button
                onClick={() => startEditPrices(item.id, item.prices)}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--accent)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                }}
              >
                edit
              </button>
            </div>
          )}
        </td>
        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
          {item.itemType === 'linked' && item.bundleComponents.length > 0 ? (
            <>
              <span
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontWeight: 800,
                  fontSize: 15,
                  color: (stock[item.bundleComponents[0].componentItemId]?.qty ?? 0) > 0 ? 'var(--ink)' : 'var(--red)',
                }}
              >
                {stock[item.bundleComponents[0].componentItemId]?.qty ?? 0}
              </span>
              <span style={{ fontSize: 11, color: 'var(--ink3)', marginLeft: 4 }}>
                {srcItem?.unit ?? item.unit}
              </span>
            </>
          ) : (
            <>
              <span
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontWeight: 800,
                  fontSize: 15,
                  color: qty > 0 ? 'var(--ink)' : 'var(--red)',
                }}
              >
                {qty}
              </span>
              <span style={{ fontSize: 11, color: 'var(--ink3)', marginLeft: 4 }}>
                {item.unit}
              </span>
            </>
          )}
        </td>
        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontWeight: 700,
              fontSize: 13,
              color: val > 0 ? 'var(--green)' : 'var(--ink3)',
            }}
          >
            {val > 0 ? `₹${val.toLocaleString()}` : '—'}
          </span>
        </td>
        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
          <Badge
            label={item.active ? 'Active' : 'Inactive'}
            color={item.active ? 'green' : 'gray'}
          />
        </td>
        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {item.itemType !== 'linked' && (
              <button
                onClick={() => openAdjust(item.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 7,
                  border: '1px solid var(--bluebd)',
                  background: 'var(--bluebg)',
                  color: 'var(--blue)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                }}
              >
                Adjust
              </button>
            )}
            {item.itemType !== 'linked' ? (
              <button
                onClick={() => openLinkEdit(item.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 7,
                  border: '1px solid var(--purplebd)',
                  background: 'var(--purplebg)',
                  color: 'var(--purple)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                }}
              >
                Link
              </button>
            ) : (
              <button
                onClick={() => unlinkItem(item.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 7,
                  border: '1px solid var(--amberbd)',
                  background: 'var(--amberbg)',
                  color: 'var(--amber)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                }}
              >
                Unlink
              </button>
            )}
            <button
              onClick={() =>
                item.active ? requestToggle(item.id) : toggleItem(item.id)
              }
              style={{
                padding: '5px 14px',
                borderRadius: 7,
                border: `1px solid ${item.active ? 'var(--redbd)' : 'var(--greenbd)'}`,
                background: item.active ? 'var(--redbg)' : 'var(--greenbg)',
                color: item.active ? 'var(--red)' : 'var(--green)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans',sans-serif",
              }}
            >
              {item.active ? 'Disable' : 'Enable'}
            </button>
          </div>
        </td>
      </tr>
    );
  };

  // Combine linked + other items into one table
  const tableItems = [...linkedItems, ...otherItems];

  return (
    <div
      className='page-enter'
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        maxWidth: 1200,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)' }}>
            Item Master
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 3 }}>
            {items.filter(i => i.active).length} active items · Inventory ₹
            {inventoryValue.toLocaleString()}
          </p>
        </div>
        <Btn onClick={() => setAddModal(true)}>+ Add Item</Btn>
      </div>

      {/* Summary strip */}
      <div className='erp-grid-4' style={{ marginBottom: 20 }}>
        {[
          { l: 'Total Items', v: items.length, c: 'var(--ink)' },
          { l: 'Active', v: items.filter(i => i.active).length, c: 'var(--green)' },
          { l: 'Inactive', v: items.filter(i => !i.active).length, c: 'var(--red)' },
          { l: 'Inventory Value', v: `₹${inventoryValue.toLocaleString()}`, c: 'var(--accent)' },
        ].map(r => (
          <div
            key={r.l}
            style={{
              background: 'var(--canvas)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '14px 16px',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                color: 'var(--ink3)',
                textTransform: 'uppercase',
                letterSpacing: '.07em',
                marginBottom: 4,
              }}
            >
              {r.l}
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: r.c,
                fontFamily: "'JetBrains Mono',monospace",
              }}
            >
              {r.v}
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          background: 'var(--canvas)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: 4,
          width: 'fit-content',
          marginBottom: 20,
          boxShadow: 'var(--shadow)',
        }}
      >
        {(
          [
            { id: 'all', l: 'All Items' },
            { id: 'active', l: 'Active' },
            { id: 'inactive', l: 'Inactive' },
          ] as const
        ).map(t => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            style={{
              padding: '6px 18px',
              borderRadius: 7,
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              background: filter === t.id ? 'var(--sidebar)' : 'transparent',
              color: filter === t.id ? '#fff' : 'var(--ink3)',
              fontFamily: "'Plus Jakarta Sans',sans-serif",
            }}
          >
            {t.l}
          </button>
        ))}
      </div>

      {/* Cylinders section — card grid */}
      {cylItems.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 14,
            }}
          >
            <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                color: 'var(--ink3)',
                textTransform: 'uppercase',
                letterSpacing: '.1em',
                padding: '0 12px',
              }}
            >
              🛢️ Cylinders
            </span>
            <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
          </div>
          <div className='erp-grid-3'>
            {cylItems.map(item => {
              const qty = stock[item.id]?.qty ?? 0;
              const cylPrimaryPrice = item.prices[0]?.price ?? 0;
              const val = qty * cylPrimaryPrice;
              const isEditing = editingPricesId === item.id;
              return (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--canvas)',
                    borderRadius: 14,
                    border: `1px solid ${item.active ? 'var(--border)' : 'var(--border2)'}`,
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow2)',
                    opacity: item.active ? 1 : 0.6,
                  }}
                >
                  <div
                    style={{
                      background: item.active ? 'var(--sidebar)' : '#2a2a2a',
                      padding: '16px 18px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'rgba(255,255,255,.4)',
                          marginTop: 3,
                        }}
                      >
                        ID #{item.id} · {item.unit}
                      </div>
                    </div>
                    <div
                      style={{
                        background: 'rgba(255,255,255,.12)',
                        borderRadius: 8,
                        padding: '4px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'rgba(255,255,255,.7)',
                      }}
                    >
                      {item.active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '20px 18px',
                      textAlign: 'center',
                      borderBottom: '1px solid var(--border)',
                      background: qty > 0 ? 'var(--greenbg)' : 'var(--redbg)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 44,
                        fontWeight: 900,
                        color: qty > 0 ? 'var(--green)' : 'var(--red)',
                        fontFamily: "'JetBrains Mono',monospace",
                      }}
                    >
                      {qty}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: qty > 0 ? 'var(--green)' : 'var(--red)',
                        textTransform: 'uppercase',
                        letterSpacing: '.07em',
                        marginTop: 4,
                      }}
                    >
                      In Stock
                    </div>
                    <button
                      onClick={() => openAdjust(item.id)}
                      style={{
                        marginTop: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        color: qty > 0 ? 'var(--green)' : 'var(--red)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontFamily: "'Plus Jakarta Sans',sans-serif",
                        opacity: 0.7,
                      }}
                    >
                      adjust
                    </button>
                  </div>
                  <div
                    style={{
                      padding: '12px 18px',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: 'var(--ink3)',
                          textTransform: 'uppercase',
                          letterSpacing: '.06em',
                          marginBottom: 3,
                        }}
                      >
                        Sale Price
                      </div>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {editingPricesValues.map((pv, pi) => (
                            <div key={pi} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                              <input
                                type='number'
                                value={pv.price}
                                onChange={e => {
                                  const next = [...editingPricesValues];
                                  next[pi] = { ...next[pi], price: e.target.value };
                                  setEditingPricesValues(next);
                                }}
                                autoFocus={pi === 0}
                                style={{
                                  width: 90,
                                  background: 'var(--bg)',
                                  border: '2px solid var(--accent)',
                                  borderRadius: 7,
                                  padding: '5px 8px',
                                  fontSize: 14,
                                  fontWeight: 700,
                                  fontFamily: "'JetBrains Mono',monospace",
                                  outline: 'none',
                                  color: 'var(--ink)',
                                }}
                              />
                              <input
                                type='number'
                                placeholder='Deposit'
                                value={pv.deposit}
                                onChange={e => {
                                  const next = [...editingPricesValues];
                                  next[pi] = { ...next[pi], deposit: e.target.value };
                                  setEditingPricesValues(next);
                                }}
                                style={{
                                  width: 80, padding: '6px 10px', background: 'var(--bg)',
                                  border: '1px solid var(--border2)', borderRadius: 6,
                                  fontSize: 13, fontFamily: "'JetBrains Mono',monospace",
                                  fontWeight: 600, color: 'var(--amber)', outline: 'none',
                                }}
                              />
                              {editingPricesValues.length > 1 && (
                                <button
                                  onClick={() => setEditingPricesValues(prev => prev.filter((_, j) => j !== pi))}
                                  style={{
                                    padding: '2px 6px', borderRadius: 5,
                                    border: '1px solid var(--border2)', background: 'transparent',
                                    color: 'var(--ink3)', fontSize: 11, cursor: 'pointer',
                                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                                  }}
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                          <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                            <button
                              onClick={() => setEditingPricesValues(prev => [...prev, { price: '0', deposit: '0' }])}
                              style={{
                                padding: '4px 8px', borderRadius: 6,
                                border: '1px solid var(--border2)', background: 'transparent',
                                color: 'var(--accent)', fontSize: 11, fontWeight: 700,
                                cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif",
                              }}
                            >
                              + Price
                            </button>
                            <button
                              onClick={() => saveEditedPrices(item.id)}
                              style={{
                                padding: '5px 10px', borderRadius: 7, border: 'none',
                                background: 'var(--accent)', color: '#fff', fontSize: 12,
                                fontWeight: 700, cursor: 'pointer',
                                fontFamily: "'Plus Jakarta Sans',sans-serif",
                              }}
                            >
                              ✓
                            </button>
                            <button
                              onClick={cancelEditPrices}
                              style={{
                                padding: '5px 10px', borderRadius: 7,
                                border: '1px solid var(--border2)', background: 'transparent',
                                color: 'var(--ink3)', fontSize: 12, cursor: 'pointer',
                                fontFamily: "'Plus Jakarta Sans',sans-serif",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 18,
                              fontWeight: 900,
                              color: 'var(--ink)',
                              fontFamily: "'JetBrains Mono',monospace",
                            }}
                          >
                            {item.prices.length > 0
                              ? item.prices.map(p => `₹${p.price.toLocaleString()}`).join(', ')
                              : '₹0'}
                          </span>
                          <button
                            onClick={() => startEditPrices(item.id, item.prices)}
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: 'var(--accent)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              fontFamily: "'Plus Jakarta Sans',sans-serif",
                            }}
                          >
                            edit
                          </button>
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: 'var(--ink3)',
                          textTransform: 'uppercase',
                          letterSpacing: '.06em',
                          marginBottom: 3,
                        }}
                      >
                        Stock Value
                      </div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: val > 0 ? 'var(--green)' : 'var(--ink3)',
                          fontFamily: "'JetBrains Mono',monospace",
                        }}
                      >
                        {val > 0 ? `₹${val.toLocaleString()}` : '₹0'}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '10px 18px' }}>
                    <button
                      onClick={() =>
                        item.active ? requestToggle(item.id) : toggleItem(item.id)
                      }
                      style={{
                        width: '100%',
                        padding: '7px',
                        borderRadius: 8,
                        border: `1px solid ${item.active ? 'var(--redbd)' : 'var(--greenbd)'}`,
                        background: item.active ? 'var(--redbg)' : 'var(--greenbg)',
                        color: item.active ? 'var(--red)' : 'var(--green)',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: "'Plus Jakarta Sans',sans-serif",
                      }}
                    >
                      {item.active ? 'Disable Item' : 'Enable Item'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All other items table (Linked + Regular together) */}
      {tableItems.length > 0 && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 14,
            }}
          >
            <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                color: 'var(--ink3)',
                textTransform: 'uppercase',
                letterSpacing: '.1em',
                padding: '0 12px',
              }}
            >
              📦 Items
            </span>
            <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
          </div>
          <div
            style={{
              background: 'var(--canvas)',
              borderRadius: 14,
              border: '1px solid var(--border)',
              overflow: 'clip',
              boxShadow: 'var(--shadow2)',
            }}
          >
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table
                style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse' }}
              >
                <thead>
                  <tr
                    style={{
                      background: 'var(--bg)',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {['Item', 'Type', 'Price', 'Stock', 'Value', 'Status', ''].map(
                      (h, i) => (
                        <th
                          key={`${h}-${i}`}
                          style={{
                            padding: '10px 18px',
                            fontSize: 10.5,
                            fontWeight: 800,
                            color: 'var(--ink3)',
                            textTransform: 'uppercase',
                            letterSpacing: '.07em',
                            textAlign: i === 0 ? 'left' : i < 6 ? 'right' : 'right',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {tableItems.map((item, idx) =>
                    renderTableRow(item, idx, tableItems)
                  )}
                </tbody>
                <tfoot>
                  <tr
                    style={{
                      background: 'var(--accentbg)',
                      borderTop: '2px solid var(--accentbd)',
                    }}
                  >
                    <td
                      colSpan={4}
                      style={{
                        padding: '12px 18px',
                        fontWeight: 800,
                        color: 'var(--accent)',
                        fontSize: 13,
                      }}
                    >
                      Total Inventory Value (non-cylinder)
                    </td>
                    <td
                      style={{
                        padding: '12px 18px',
                        textAlign: 'right',
                        fontFamily: "'JetBrains Mono',monospace",
                        fontWeight: 900,
                        fontSize: 15,
                        color: 'var(--accent)',
                      }}
                      colSpan={3}
                    >
                      ₹
                      {tableItems
                        .filter(i => i.active && i.itemType !== 'linked')
                        .reduce(
                          (s, it) => s + (stock[it.id]?.qty ?? 0) * (it.prices[0]?.price ?? 0),
                          0
                        )
                        .toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add item modal */}
      {addModal && (
        <Modal title='Add New Item' onClose={() => setAddModal(false)} width={460}>
          <Field
            label='Item Name'
            value={form.name}
            onChange={v => setField('name', v)}
            required
            placeholder='e.g. Pressure Regulator'
          />
          <Field
            label='Unit'
            value={form.unit}
            onChange={v => setField('unit', v)}
            opts={['Piece', 'Kg', 'Mtr', 'Set', 'Pair', 'Box']}
          />

          {/* Multi-price inputs */}
          <div style={{ marginBottom: 4 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <div style={{
                flex: 1,
                fontSize: 11, fontWeight: 800, color: 'var(--ink3)',
                textTransform: 'uppercase', letterSpacing: '.07em',
              }}>
                Prices (₹) <span style={{ color: 'var(--red)' }}>*</span>
              </div>
              <div style={{
                width: 90,
                fontSize: 11, fontWeight: 800, color: 'var(--amber)',
                textTransform: 'uppercase', letterSpacing: '.07em',
              }}>
                Deposit
              </div>
            </div>
            {form.prices.map((pv, pi) => (
              <div key={pi} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                <input
                  type='number'
                  value={pv.price}
                  onChange={e => {
                    const next = [...form.prices];
                    next[pi] = { ...next[pi], price: e.target.value };
                    setField('prices', next);
                  }}
                  placeholder='0'
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1.5px solid var(--border2)',
                    background: 'var(--canvas)',
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono',monospace",
                    outline: 'none',
                    color: 'var(--ink)',
                  }}
                />
                <input
                  type='number'
                  placeholder='Deposit'
                  value={pv.deposit}
                  onChange={e => {
                    const next = [...form.prices];
                    next[pi] = { ...next[pi], deposit: e.target.value };
                    setField('prices', next);
                  }}
                  style={{
                    width: 80, padding: '6px 10px', background: 'var(--bg)',
                    border: '1px solid var(--border2)', borderRadius: 6,
                    fontSize: 13, fontFamily: "'JetBrains Mono',monospace",
                    fontWeight: 600, color: 'var(--amber)', outline: 'none',
                  }}
                />
                {form.prices.length > 1 && (
                  <button
                    onClick={() => setField('prices', form.prices.filter((_, j) => j !== pi))}
                    style={{
                      padding: '5px 10px', borderRadius: 7,
                      border: '1px solid var(--border2)', background: 'transparent',
                      color: 'var(--ink3)', fontSize: 13, cursor: 'pointer',
                      fontFamily: "'Plus Jakarta Sans',sans-serif",
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setField('prices', [...form.prices, { price: '', deposit: '0' }])}
              style={{
                padding: '5px 12px', borderRadius: 7,
                border: '1px solid var(--border2)', background: 'transparent',
                color: 'var(--accent)', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif",
              }}
            >
              + Add Price
            </button>
          </div>

          {/* Item Type selector */}
          <Field
            label='Item Type'
            value={form.itemType}
            onChange={v => setItemType(v as ItemType)}
            opts={[
              { v: 'regular', l: 'Regular — own stock, appears in purchase & billing' },
              { v: 'cylinder', l: 'Cylinder — gas cylinder, shown in Cylinders section' },
              { v: 'linked', l: 'Linked — draws stock from another item when billed' },
            ]}
          />

          {/* Info for linked items — stock source configured after creation */}
          {form.itemType === 'linked' && (
            <div
              style={{
                background: 'var(--purplebg, #f5f0ff)',
                border: '1px solid var(--purplebd, #c4b5fd)',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 12,
                color: 'var(--purple)',
                fontWeight: 600,
              }}
            >
              After creating this item, use the "Link" button to configure which
              stock source it draws from when billed.
            </div>
          )}

          <div
            style={{
              background: 'var(--amberbg)',
              border: '1px solid var(--amberbd)',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              color: 'var(--amber)',
              fontWeight: 600,
            }}
          >
            ⚠️ Enter 0 for free / scheme items. Price can be edited later.
          </div>
          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'flex-end',
              borderTop: '1px solid var(--border)',
              paddingTop: 14,
              marginTop: 4,
            }}
          >
            <Btn variant='ghost' onClick={() => setAddModal(false)}>
              Cancel
            </Btn>
            <Btn onClick={addItem}>Add Item</Btn>
          </div>
        </Modal>
      )}

      {/* Disable item confirmation modal */}
      {pendingToggleItem && (
        <Modal title='Disable Item?' onClose={cancelToggle} width={400}>
          <div
            style={{
              background: 'var(--redbg)',
              border: '1px solid var(--redbd)',
              borderRadius: 8,
              padding: '12px 16px',
              fontSize: 13,
              color: 'var(--red)',
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            ⚠️ Disabling <strong>{pendingToggleItem.name}</strong> will hide it
            from billing. Any existing bills are not affected.
          </div>
          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'flex-end',
              borderTop: '1px solid var(--border)',
              paddingTop: 14,
              marginTop: 4,
            }}
          >
            <Btn variant='ghost' onClick={cancelToggle}>
              Cancel
            </Btn>
            <Btn
              onClick={confirmToggle}
              style={{ background: 'var(--red)', border: 'none' }}
            >
              Yes, Disable
            </Btn>
          </div>
        </Modal>
      )}

      {/* Link-to-source modal */}
      {linkEditId !== null && (() => {
        const linkItem = items.find(i => i.id === linkEditId);
        if (!linkItem) return null;
        return (
          <Modal
            title={`Link "${linkItem.name}" to Stock Source`}
            onClose={closeLinkEdit}
            width={400}
          >
            <p style={{ fontSize: 13, color: 'var(--ink2)', marginBottom: 16, lineHeight: 1.5 }}>
              When billed, this item will draw stock from the selected source instead of its own stock.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                Stock Source (Cylinder) <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <select
                value={linkEditSourceId}
                onChange={e => setLinkEditSourceId(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8,
                  border: '1.5px solid var(--border2)', background: 'var(--canvas)',
                  fontSize: 13, color: 'var(--ink)', outline: 'none',
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                }}
              >
                <option value=''>— Select cylinder —</option>
                {allCylinderItems.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Btn variant='ghost' onClick={closeLinkEdit}>Cancel</Btn>
              <Btn onClick={() => saveLinkEdit(linkEditSourceId)}>Save Link</Btn>
            </div>
          </Modal>
        );
      })()}

      {/* Stock adjust modal */}
      {adjustItem !== null && adjustItemData && (
        <Modal
          title={`Adjust Stock — ${adjustItemData.name}`}
          onClose={closeAdjust}
          width={380}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 14px',
              background: 'var(--bg)',
              borderRadius: 8,
              border: '1px solid var(--border)',
              marginBottom: 4,
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--ink3)', fontWeight: 600 }}>
              Current Stock
            </span>
            <span
              style={{ fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}
            >
              {stock[adjustItem]?.qty ?? 0} {adjustItemData.unit}
            </span>
          </div>
          <Field
            label='New Quantity'
            type='number'
            value={adjustQty}
            onChange={setAdjustQty}
            placeholder='0'
            required
          />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant='ghost' onClick={closeAdjust}>
              Cancel
            </Btn>
            <Btn onClick={saveAdjust}>Update Stock</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};
