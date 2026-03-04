import {
  Page,
  Btn,
  Badge,
  Modal,
  Field,
  Row,
} from '../../shared/components/ui';
import { useStaff } from './useStaff';

const ROLE_COLORS: Record<string, 'orange' | 'green' | 'blue' | 'gray'> = {
  Admin: 'orange',
  Staff: 'green',
  Viewer: 'gray',
};

// Format a numeric timestamp to a readable date
const fmtDate = (ts: number) =>
  new Date(ts).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

export const StaffPage = () => {
  const {
    staff,
    activeCount,
    byRole,
    ROLES,
    // add modal
    addModal,
    openAdd,
    closeAdd,
    form,
    setField,
    showPwd,
    setShowPwd,
    addStaff,
    // edit role modal
    editMember,
    newRole,
    setNewRole,
    openEditRole,
    closeEditRole,
    saveRole,
    // toggle active
    toggleActive,
    // reset password modal
    resetModal,
    resetTarget,
    resetPwd,
    setResetPwd,
    openReset,
    saveReset,
    setResetModal,
  } = useStaff();

  return (
    <Page
      title='Staff Management'
      subtitle={`${activeCount} active · ${staff.length} total`}
      action={<Btn onClick={openAdd}>+ Add Staff</Btn>}
    >
      {/* Role summary strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 14,
        }}
      >
        {ROLES.map(role => (
          <div
            key={role}
            style={{
              background: 'var(--canvas)',
              border: '1px solid var(--border)',
              borderRadius: 12,
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
                marginBottom: 6,
              }}
            >
              {role}
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 900,
                color: 'var(--ink)',
                fontFamily: "'JetBrains Mono',monospace",
              }}
            >
              {byRole(role)}
            </div>
          </div>
        ))}
      </div>

      {/* Staff table */}
      {staff.length === 0 ? (
        <div
          style={{
            background: 'var(--canvas)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '60px 40px',
            textAlign: 'center',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 14 }}>👤</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
            No staff yet
          </div>
          <Btn onClick={openAdd}>+ Add First Staff Member</Btn>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--canvas)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: 'var(--shadow2)',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13.5,
            }}
          >
            <thead>
              <tr
                style={{
                  background: 'var(--bg)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                {['Name', 'Username', 'Role', 'Status', 'Since', ''].map(
                  (h, i) => (
                    <th
                      key={`${h}-${i}`}
                      style={{
                        padding: '11px 18px',
                        fontSize: 10.5,
                        fontWeight: 800,
                        color: 'var(--ink3)',
                        textTransform: 'uppercase',
                        letterSpacing: '.07em',
                        textAlign: i === 5 ? 'right' : 'left',
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
              {staff.map((member, idx) => (
                <tr
                  key={member.id}
                  style={{
                    borderBottom:
                      idx < staff.length - 1
                        ? '1px solid var(--border)'
                        : 'none',
                    opacity: member.active ? 1 : 0.55,
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
                        fontWeight: 700,
                        color: 'var(--ink)',
                        fontSize: 14,
                      }}
                    >
                      {member.name}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 13,
                        color: 'var(--accent)',
                        fontWeight: 600,
                      }}
                    >
                      {member.u}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <Badge
                      label={member.role}
                      color={ROLE_COLORS[member.role] ?? 'gray'}
                    />
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <Badge
                      label={member.active ? 'Active' : 'Inactive'}
                      color={member.active ? 'green' : 'gray'}
                    />
                  </td>
                  <td
                    style={{
                      padding: '14px 18px',
                      color: 'var(--ink3)',
                      fontSize: 12,
                    }}
                  >
                    {fmtDate(member.createdAt)}
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div
                      style={{
                        display: 'flex',
                        gap: 6,
                        justifyContent: 'flex-end',
                      }}
                    >
                      <button
                        onClick={() => openEditRole(member)}
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
                        Role
                      </button>
                      <button
                        onClick={() => openReset(member)}
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
                        Password
                      </button>
                      <button
                        onClick={() => toggleActive(member.id)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 7,
                          border: `1px solid ${member.active ? 'var(--redbd)' : 'var(--greenbd)'}`,
                          background: member.active
                            ? 'var(--redbg)'
                            : 'var(--greenbg)',
                          color: member.active ? 'var(--red)' : 'var(--green)',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontFamily: "'Plus Jakarta Sans',sans-serif",
                        }}
                      >
                        {member.active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add Staff Modal ── */}
      {addModal && (
        <Modal title='Add New Staff Member' onClose={closeAdd} width={480}>
          <Row>
            <Field
              label='Full Name'
              value={form.name}
              onChange={v => setField('name', v)}
              required
              placeholder='e.g. Priya Sharma'
            />
            <Field
              label='Username'
              value={form.u}
              onChange={v => setField('u', v)}
              required
              placeholder='e.g. priya'
            />
          </Row>

          {/* Password field */}
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: 'var(--ink3)',
                textTransform: 'uppercase',
                letterSpacing: '.07em',
                marginBottom: 6,
              }}
            >
              Password{' '}
              <span style={{ color: 'var(--red)', fontWeight: 900 }}>*</span>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.p}
                onChange={e => setField('p', e.target.value)}
                placeholder='Min 8 characters'
                style={{
                  width: '100%',
                  background: 'var(--bg)',
                  border: '1px solid var(--border2)',
                  borderRadius: 8,
                  padding: '9px 44px 9px 12px',
                  fontSize: 13,
                  color: 'var(--ink)',
                  outline: 'none',
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                  boxSizing: 'border-box',
                }}
              />
              <button
                onClick={() => setShowPwd(v => !v)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 16,
                  color: 'var(--ink3)',
                }}
              >
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Role selector */}
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: 'var(--ink3)',
                textTransform: 'uppercase',
                letterSpacing: '.07em',
                marginBottom: 8,
              }}
            >
              Role
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              {ROLES.map(role => (
                <button
                  key={role}
                  onClick={() => setField('role', role)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    border: `2px solid ${form.role === role ? 'var(--accent)' : 'var(--border)'}`,
                    background:
                      form.role === role ? 'var(--accentbg)' : 'var(--canvas)',
                    fontWeight: 700,
                    fontSize: 13,
                    color: form.role === role ? 'var(--accent)' : 'var(--ink3)',
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                    textAlign: 'left',
                  }}
                >
                  <Badge label={role} color={ROLE_COLORS[role] ?? 'gray'} />
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: 'var(--ink3)',
                      marginTop: 6,
                      lineHeight: 1.4,
                    }}
                  >
                    {role === 'Admin' && 'Full access — all pages'}
                    {role === 'Staff' &&
                      'Billing, purchase, customers, ledger, reports'}
                    {role === 'Viewer' &&
                      'Dashboard, Cash & Bank, reports — read only'}
                  </div>
                </button>
              ))}
            </div>
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
            <Btn variant='ghost' onClick={closeAdd}>
              Cancel
            </Btn>
            <Btn onClick={addStaff}>Add Staff Member</Btn>
          </div>
        </Modal>
      )}

      {/* ── Edit Role Modal ── */}
      {editMember && (
        <Modal
          title={`Change Role — ${editMember.name}`}
          onClose={closeEditRole}
          width={400}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ROLES.map(role => (
              <button
                key={role}
                onClick={() => setNewRole(role)}
                style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  border: `2px solid ${newRole === role ? 'var(--accent)' : 'var(--border)'}`,
                  background:
                    newRole === role ? 'var(--accentbg)' : 'var(--canvas)',
                  fontWeight: 700,
                  fontSize: 13,
                  color: newRole === role ? 'var(--accent)' : 'var(--ink3)',
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Badge label={role} color={ROLE_COLORS[role] ?? 'gray'} />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--ink3)',
                  }}
                >
                  {role === 'Admin' && '— Full access'}
                  {role === 'Staff' &&
                    '— Billing, purchase, customers, ledger, reports'}
                  {role === 'Viewer' && '— Read only'}
                </span>
              </button>
            ))}
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
            <Btn variant='ghost' onClick={closeEditRole}>
              Cancel
            </Btn>
            <Btn onClick={saveRole}>Save Role</Btn>
          </div>
        </Modal>
      )}

      {/* ── Reset Password Modal ── */}
      {resetModal && resetTarget && (
        <Modal
          title={`Reset Password — ${resetTarget.name}`}
          onClose={() => setResetModal(false)}
          width={380}
        >
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
            ⚠️ This will immediately change the user's password.
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: 'var(--ink3)',
                textTransform: 'uppercase',
                letterSpacing: '.07em',
                marginBottom: 6,
              }}
            >
              New Password
            </div>
            <input
              type='text'
              value={resetPwd}
              onChange={e => setResetPwd(e.target.value)}
              placeholder='Min 8 characters'
              autoFocus
              style={{
                width: '100%',
                background: 'var(--bg)',
                border: '1px solid var(--border2)',
                borderRadius: 8,
                padding: '9px 12px',
                fontSize: 13,
                color: 'var(--ink)',
                outline: 'none',
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant='ghost' onClick={() => setResetModal(false)}>
              Cancel
            </Btn>
            <Btn variant='success' onClick={saveReset}>
              Reset Password
            </Btn>
          </div>
        </Modal>
      )}
    </Page>
  );
};
