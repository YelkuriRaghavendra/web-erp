import { Btn, Field, Modal, Row, Badge } from '../../shared/components/ui';
import { useItems } from './useItems';

export const ItemMasterPage = () => {
  const {
    items,
    stock,
    filter,
    setFilter,
    cylItems,
    otherItems,
    inventoryValue,
    addModal,
    setAddModal,
    form,
    setField,
    addItem,
    editId,
    editPrice,
    setEditPrice,
    startEditPrice,
    savePrice,
    cancelEditPrice,
    toggleItem,
    adjustItem,
    adjustItemData,
    adjustQty,
    setAdjustQty,
    openAdjust,
    saveAdjust,
    closeAdjust,
  } = useItems();

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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 14,
          marginBottom: 20,
        }}
      >
        {[
          { l: 'Total Items', v: items.length, c: 'var(--ink)' },
          {
            l: 'Active',
            v: items.filter(i => i.active).length,
            c: 'var(--green)',
          },
          {
            l: 'Inactive',
            v: items.filter(i => !i.active).length,
            c: 'var(--red)',
          },
          {
            l: 'Inventory Value',
            v: `₹${inventoryValue.toLocaleString()}`,
            c: 'var(--accent)',
          },
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

      {/* Cylinders section */}
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3,1fr)',
              gap: 14,
            }}
          >
            {cylItems.map(item => {
              const qty = stock[item.id]?.qty ?? 0;
              const val = qty * item.price;
              const isEditing = editId === item.id;
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
                      <div
                        style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}
                      >
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
                        <div
                          style={{
                            display: 'flex',
                            gap: 6,
                            alignItems: 'center',
                          }}
                        >
                          <input
                            type='number'
                            value={editPrice}
                            onChange={e => setEditPrice(e.target.value)}
                            autoFocus
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
                          <button
                            onClick={() => savePrice()}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 7,
                              border: 'none',
                              background: 'var(--accent)',
                              color: '#fff',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontFamily: "'Plus Jakarta Sans',sans-serif",
                            }}
                          >
                            ✓
                          </button>
                          <button
                            onClick={cancelEditPrice}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 7,
                              border: '1px solid var(--border2)',
                              background: 'transparent',
                              color: 'var(--ink3)',
                              fontSize: 12,
                              cursor: 'pointer',
                              fontFamily: "'Plus Jakarta Sans',sans-serif",
                            }}
                          >
                            ✕
                          </button>
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
                            ₹{item.price.toLocaleString()}
                          </span>
                          <button
                            onClick={() => startEditPrice(item.id, item.price)}
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
                      onClick={() => toggleItem(item.id)}
                      style={{
                        width: '100%',
                        padding: '7px',
                        borderRadius: 8,
                        border: `1px solid ${item.active ? 'var(--redbd)' : 'var(--greenbd)'}`,
                        background: item.active
                          ? 'var(--redbg)'
                          : 'var(--greenbg)',
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

      {/* Other items table */}
      {otherItems.length > 0 && (
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
              📦 Other Items
            </span>
            <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
          </div>
          <div
            style={{
              background: 'var(--canvas)',
              borderRadius: 14,
              border: '1px solid var(--border)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow2)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  style={{
                    background: 'var(--bg)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {['Item', 'Price', 'Stock', 'Value', 'Status', ''].map(
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
                          textAlign:
                            i > 0 && i < 5
                              ? 'right'
                              : i === 5
                                ? 'right'
                                : 'left',
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
                {otherItems.map((item, idx) => {
                  const qty = stock[item.id]?.qty ?? 0;
                  const val = qty * item.price;
                  const isEditing = editId === item.id;
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom:
                          idx < otherItems.length - 1
                            ? '1px solid var(--border)'
                            : 'none',
                        opacity: item.active ? 1 : 0.55,
                      }}
                      onMouseEnter={e =>
                        (e.currentTarget.style.background = 'var(--bg)')
                      }
                      onMouseLeave={e =>
                        (e.currentTarget.style.background = 'transparent')
                      }
                    >
                      <td style={{ padding: '14px 18px' }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: item.active ? 'var(--ink)' : 'var(--ink3)',
                          }}
                        >
                          {item.name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--ink3)',
                            marginTop: 2,
                          }}
                        >
                          ID #{item.id} · {item.unit}
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        {isEditing ? (
                          <div
                            style={{
                              display: 'flex',
                              gap: 5,
                              justifyContent: 'flex-end',
                              alignItems: 'center',
                            }}
                          >
                            <span
                              style={{ fontSize: 13, color: 'var(--ink3)' }}
                            >
                              ₹
                            </span>
                            <input
                              type='number'
                              value={editPrice}
                              onChange={e => setEditPrice(e.target.value)}
                              autoFocus
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
                            <button
                              onClick={() => savePrice()}
                              style={{
                                padding: '5px 9px',
                                borderRadius: 6,
                                border: 'none',
                                background: 'var(--accent)',
                                color: '#fff',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: "'Plus Jakarta Sans',sans-serif",
                              }}
                            >
                              ✓
                            </button>
                            <button
                              onClick={cancelEditPrice}
                              style={{
                                padding: '5px 9px',
                                borderRadius: 6,
                                border: '1px solid var(--border2)',
                                background: 'transparent',
                                color: 'var(--ink3)',
                                fontSize: 11,
                                cursor: 'pointer',
                                fontFamily: "'Plus Jakarta Sans',sans-serif",
                              }}
                            >
                              ✕
                            </button>
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
                                color:
                                  item.price > 0 ? 'var(--ink)' : 'var(--ink3)',
                              }}
                            >
                              {item.price > 0
                                ? `₹${item.price.toLocaleString()}`
                                : 'Free'}
                            </span>
                            <button
                              onClick={() =>
                                startEditPrice(item.id, item.price)
                              }
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
                        <span
                          style={{
                            fontSize: 11,
                            color: 'var(--ink3)',
                            marginLeft: 4,
                          }}
                        >
                          {item.unit}
                        </span>
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
                        <div
                          style={{
                            display: 'flex',
                            gap: 8,
                            justifyContent: 'flex-end',
                          }}
                        >
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
                          <button
                            onClick={() => toggleItem(item.id)}
                            style={{
                              padding: '5px 14px',
                              borderRadius: 7,
                              border: `1px solid ${item.active ? 'var(--redbd)' : 'var(--greenbd)'}`,
                              background: item.active
                                ? 'var(--redbg)'
                                : 'var(--greenbg)',
                              color: item.active
                                ? 'var(--red)'
                                : 'var(--green)',
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
                })}
              </tbody>
              <tfoot>
                <tr
                  style={{
                    background: 'var(--accentbg)',
                    borderTop: '2px solid var(--accentbd)',
                  }}
                >
                  <td
                    colSpan={3}
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
                    {otherItems
                      .filter(i => i.active)
                      .reduce(
                        (s, it) => s + (stock[it.id]?.qty ?? 0) * it.price,
                        0
                      )
                      .toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Add item modal */}
      {addModal && (
        <Modal
          title='Add New Item'
          onClose={() => setAddModal(false)}
          width={440}
        >
          <Field
            label='Item Name'
            value={form.name}
            onChange={v => setField('name', v)}
            required
            placeholder='e.g. Pressure Regulator'
          />
          <Row>
            <Field
              label='Unit'
              value={form.unit}
              onChange={v => setField('unit', v)}
              opts={['Piece', 'Kg', 'Mtr', 'Set', 'Pair', 'Box']}
            />
            <Field
              label='Price (₹)'
              type='number'
              value={form.price}
              onChange={v => setField('price', v)}
              placeholder='0'
            />
          </Row>
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
            ⚠️ Enter 0 for free/scheme items. Price can be edited later.
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
            <span
              style={{ fontSize: 13, color: 'var(--ink3)', fontWeight: 600 }}
            >
              Current Stock
            </span>
            <span
              style={{
                fontWeight: 800,
                fontFamily: "'JetBrains Mono',monospace",
              }}
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
