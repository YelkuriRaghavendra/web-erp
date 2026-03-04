import React, { type CSSProperties } from 'react';

// ── Badge ────────────────────────────────────────────────────
type BadgeColor =
  | 'orange'
  | 'green'
  | 'red'
  | 'blue'
  | 'amber'
  | 'purple'
  | 'gray';
export const Badge = ({
  label,
  color = 'orange',
}: {
  label: string;
  color?: BadgeColor;
}) => {
  const m: Record<BadgeColor, { bg: string; border: string; text: string }> = {
    orange: {
      bg: 'var(--accentbg)',
      border: 'var(--accentbd)',
      text: 'var(--accent)',
    },
    green: {
      bg: 'var(--greenbg)',
      border: 'var(--greenbd)',
      text: 'var(--green)',
    },
    red: { bg: 'var(--redbg)', border: 'var(--redbd)', text: 'var(--red)' },
    blue: { bg: 'var(--bluebg)', border: 'var(--bluebd)', text: 'var(--blue)' },
    amber: {
      bg: 'var(--amberbg)',
      border: 'var(--amberbd)',
      text: 'var(--amber)',
    },
    purple: {
      bg: 'var(--purplebg)',
      border: 'var(--purplebd)',
      text: 'var(--purple)',
    },
    gray: { bg: '#f5f5f5', border: '#e0e0e0', text: '#666' },
  };
  const s = m[color] ?? m.gray;
  return (
    <span
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.text,
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        padding: '2px 9px',
        letterSpacing: '.03em',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
};

export const payColor = (p: string): BadgeColor =>
  p === 'Credit' ? 'red' : p === 'Cash' ? 'green' : 'blue';
export const payLabel = (p: string) => (p === 'UPI' ? 'UPI → Bank' : p);

// ── Button ───────────────────────────────────────────────────
type BtnVariant = 'primary' | 'ghost' | 'danger' | 'success';
interface BtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  disabled?: boolean;
  small?: boolean;
  full?: boolean;
  style?: CSSProperties;
  type?: 'button' | 'submit';
}
export const Btn = ({
  children,
  onClick,
  variant = 'primary',
  disabled,
  small,
  full,
  style: sx = {},
  type = 'button',
}: BtnProps) => {
  const v: Record<
    BtnVariant,
    { bg: string; color: string; border: string; hover: string }
  > = {
    primary: {
      bg: 'var(--accent)',
      color: '#fff',
      border: 'var(--accent)',
      hover: '#c9540a',
    },
    ghost: {
      bg: 'var(--canvas)',
      color: 'var(--ink2)',
      border: 'var(--border2)',
      hover: 'var(--bg)',
    },
    danger: {
      bg: 'var(--redbg)',
      color: 'var(--red)',
      border: 'var(--redbd)',
      hover: '#fee2e2',
    },
    success: {
      bg: 'var(--greenbg)',
      color: 'var(--green)',
      border: 'var(--greenbd)',
      hover: '#dcfce7',
    },
  };
  const s = v[variant];
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        borderRadius: 8,
        padding: small ? '5px 13px' : '9px 20px',
        fontSize: small ? 12 : 13.5,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'background .15s',
        whiteSpace: 'nowrap',
        width: full ? '100%' : 'auto',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        justifyContent: 'center',
        boxShadow:
          variant === 'primary' ? '0 1px 3px rgba(232,98,10,.25)' : 'none',
        ...sx,
      }}
      onMouseEnter={e => {
        if (!disabled) e.currentTarget.style.background = s.hover;
      }}
      onMouseLeave={e => {
        if (!disabled) e.currentTarget.style.background = s.bg;
      }}
    >
      {children}
    </button>
  );
};

// ── Label ────────────────────────────────────────────────────
export const Label = ({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) => (
  <label
    style={{
      fontSize: 11.5,
      fontWeight: 700,
      color: 'var(--ink3)',
      textTransform: 'uppercase',
      letterSpacing: '.06em',
      display: 'block',
      marginBottom: 5,
    }}
  >
    {children}
    {required && <span style={{ color: 'var(--red)' }}> *</span>}
  </label>
);

const inputBase: CSSProperties = {
  background: 'var(--canvas)',
  border: '1px solid var(--border2)',
  borderRadius: 8,
  color: 'var(--ink)',
  padding: '9px 12px',
  fontSize: 14,
  outline: 'none',
  width: '100%',
  transition: 'border-color .15s, box-shadow .15s',
};

// ── Field ────────────────────────────────────────────────────
interface FieldProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  opts?: Array<string | { v: string; l: string }>;
  required?: boolean;
  readOnly?: boolean;
  hint?: string;
  style?: CSSProperties;
}
export const Field = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  opts,
  required,
  readOnly,
  hint,
  style: sx = {},
}: FieldProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', ...sx }}>
    {label && <Label required={required}>{label}</Label>}
    {opts ? (
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={readOnly}
        style={{ ...inputBase, cursor: readOnly ? 'default' : 'pointer' }}
        onFocus={e => {
          e.target.style.borderColor = 'var(--accent)';
          e.target.style.boxShadow = '0 0 0 3px var(--accentbg)';
        }}
        onBlur={e => {
          e.target.style.borderColor = 'var(--border2)';
          e.target.style.boxShadow = 'none';
        }}
      >
        {opts.map(o => {
          const val = typeof o === 'string' ? o : o.v;
          const lbl = typeof o === 'string' ? o : o.l;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>
    ) : (
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{
          ...inputBase,
          background: readOnly ? 'var(--bg)' : 'var(--canvas)',
          cursor: readOnly ? 'default' : 'text',
        }}
        onFocus={e => {
          if (!readOnly) {
            e.target.style.borderColor = 'var(--accent)';
            e.target.style.boxShadow = '0 0 0 3px var(--accentbg)';
          }
        }}
        onBlur={e => {
          e.target.style.borderColor = 'var(--border2)';
          e.target.style.boxShadow = 'none';
        }}
      />
    )}
    {hint && (
      <span style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 4 }}>
        {hint}
      </span>
    )}
  </div>
);

// ── Row / Grid ───────────────────────────────────────────────
export const Row = ({
  children,
  gap = 12,
  cols,
}: {
  children: React.ReactNode;
  gap?: number;
  cols?: number;
}) => {
  const n =
    cols ?? (Array.isArray(children) ? children.filter(Boolean).length : 2);
  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: `repeat(${n},1fr)`, gap }}
    >
      {children}
    </div>
  );
};

export const Grid = ({
  cols = 4,
  gap = 14,
  children,
}: {
  cols?: number;
  gap?: number;
  children: React.ReactNode;
}) => (
  <div
    style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap }}
  >
    {children}
  </div>
);

// ── Divider ──────────────────────────────────────────────────
export const Divider = ({ label }: { label?: string }) => (
  <div
    style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0' }}
  >
    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    {label && (
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--ink3)',
          textTransform: 'uppercase',
          letterSpacing: '.06em',
        }}
      >
        {label}
      </span>
    )}
    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
  </div>
);

// ── Table ────────────────────────────────────────────────────
export interface TableCol<T = object> {
  k: string;
  l: string;
  right?: boolean;
  r?: (val: unknown, row: T) => React.ReactNode;
}
export const Table = <T extends object>({
  cols,
  rows,
  empty = 'No records.',
  footer,
}: {
  cols: TableCol<T>[];
  rows: T[];
  empty?: string;
  footer?: React.ReactNode;
}) => (
  <div
    style={{
      borderRadius: 10,
      border: '1px solid var(--border)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow)',
    }}
  >
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}
      >
        <thead>
          <tr style={{ background: 'var(--bg)' }}>
            {cols.map(c => (
              <th
                key={String(c.k)}
                style={{
                  padding: '10px 16px',
                  textAlign: c.right ? 'right' : 'left',
                  color: 'var(--ink3)',
                  fontWeight: 700,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                  borderBottom: '1px solid var(--border)',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.l}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={cols.length}
                style={{
                  padding: '48px 20px',
                  textAlign: 'center',
                  color: 'var(--ink3)',
                }}
              >
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--canvas)',
                  transition: 'background .1s',
                }}
                onMouseEnter={e =>
                  (e.currentTarget.style.background = 'var(--bg)')
                }
                onMouseLeave={e =>
                  (e.currentTarget.style.background = 'var(--canvas)')
                }
              >
                {cols.map(c => (
                  <td
                    key={String(c.k)}
                    style={{
                      padding: '11px 16px',
                      verticalAlign: 'middle',
                      color: 'var(--ink2)',
                      textAlign: c.right ? 'right' : 'left',
                    }}
                  >
                    {c.r
                      ? c.r((r as Record<string, unknown>)[c.k], r)
                      : String((r as Record<string, unknown>)[c.k] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
        {footer && (
          <tfoot>
            <tr
              style={{
                background: 'var(--bg)',
                borderTop: '2px solid var(--border2)',
              }}
            >
              {footer}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  </div>
);

// ── Modal ────────────────────────────────────────────────────
export const Modal = ({
  title,
  children,
  onClose,
  width = 520,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  width?: number;
}) => (
  <div
    className='modal-wrap'
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15,15,20,.45)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(6px)',
      padding: 16,
    }}
    onClick={onClose}
  >
    <div
      className='modal-box'
      style={{
        background: 'var(--canvas)',
        borderRadius: 16,
        boxShadow: 'var(--shadow3)',
        padding: 32,
        width,
        maxWidth: '96vw',
        maxHeight: '92vh',
        overflowY: 'auto',
      }}
      onClick={e => e.stopPropagation()}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)' }}>
          {title}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--ink3)',
            fontSize: 18,
          }}
        >
          ×
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
      </div>
    </div>
  </div>
);

// ── Toast ────────────────────────────────────────────────────
export const Toast = ({
  msg,
  type,
}: {
  msg: string;
  type: 'success' | 'error';
}) => (
  <div
    style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 9999,
      background: type === 'error' ? 'var(--red)' : 'var(--green)',
      color: '#fff',
      borderRadius: 10,
      padding: '11px 20px',
      fontSize: 13.5,
      fontWeight: 700,
      boxShadow: '0 8px 32px rgba(0,0,0,.18)',
      animation: 'fadeUp .3s ease',
    }}
  >
    {type === 'error' ? '✗' : '✓'} {msg}
  </div>
);

// ── StatCard ─────────────────────────────────────────────────
type StatColor =
  | 'orange'
  | 'green'
  | 'red'
  | 'blue'
  | 'amber'
  | 'purple'
  | 'gray';
export const StatCard = ({
  label,
  value,
  sub,
  icon,
  color = 'orange',
  style: sx = {},
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: string;
  color?: StatColor;
  style?: CSSProperties;
}) => {
  const colors: Record<
    StatColor,
    { bg: string; border: string; text: string }
  > = {
    orange: {
      bg: 'var(--accentbg)',
      border: 'var(--accentbd)',
      text: 'var(--accent)',
    },
    green: {
      bg: 'var(--greenbg)',
      border: 'var(--greenbd)',
      text: 'var(--green)',
    },
    red: { bg: 'var(--redbg)', border: 'var(--redbd)', text: 'var(--red)' },
    blue: { bg: 'var(--bluebg)', border: 'var(--bluebd)', text: 'var(--blue)' },
    amber: {
      bg: 'var(--amberbg)',
      border: 'var(--amberbd)',
      text: 'var(--amber)',
    },
    purple: {
      bg: 'var(--purplebg)',
      border: 'var(--purplebd)',
      text: 'var(--purple)',
    },
    gray: { bg: 'var(--bg)', border: 'var(--border)', text: 'var(--ink2)' },
  };
  const c = colors[color] ?? colors.gray;
  return (
    <div
      style={{
        background: 'var(--canvas)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '18px 20px',
        boxShadow: 'var(--shadow)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow .2s,border-color .2s',
        ...sx,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow2)';
        e.currentTarget.style.borderColor = c.border;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow)';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 80,
          height: 80,
          borderRadius: '0 12px 0 80px',
          background: c.bg,
        }}
      />
      <div style={{ fontSize: 22, marginBottom: 10, position: 'relative' }}>
        {icon}
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--ink3)',
          textTransform: 'uppercase',
          letterSpacing: '.07em',
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: 'var(--ink)',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{ fontSize: 12, color: c.text, marginTop: 5, fontWeight: 600 }}
        >
          {sub}
        </div>
      )}
    </div>
  );
};

// ── Page shell ───────────────────────────────────────────────
export const Page = ({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div
    className='page-enter'
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 22,
      maxWidth: 1200,
    }}
  >
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: 'var(--ink)',
            letterSpacing: '-.02em',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 3 }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
    {children}
  </div>
);
