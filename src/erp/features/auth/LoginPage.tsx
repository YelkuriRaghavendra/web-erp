import { useState, useRef } from 'react';
import { Field, Btn } from '../../shared/components/ui';
import { useERPStore } from '../../core/store';
import { hashPassword } from '../../core/crypto';
import { fetchAllStaff } from '../../core/supabase';
import type { ERPUser } from '../../core/types';

// ── Per-username failed-attempt tracker (in-memory, clears on reload) ──
const failMap = new Map<string, { count: number; until: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000; // 30 seconds

export const LoginPage = ({ onLogin }: { onLogin: (u: ERPUser) => void }) => {
  const staff = useERPStore(s => s.staff);
  const setStaff = useERPStore(s => s.setStaff);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [lockSecs, setLockSecs] = useState(0);
  const [retrying, setRetrying] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Manual retry — re-fetch staff from Supabase without full page reload
  const retryFetch = async () => {
    setRetrying(true);
    const result = await fetchAllStaff();
    console.log('[LoginPage] retry result:', result);
    if (result.length) setStaff(result);
    setRetrying(false);
  };

  const startLockCountdown = (remaining: number) => {
    setLockSecs(Math.ceil(remaining / 1000));
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setLockSecs(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setErr('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const go = async () => {
    const key = username.trim().toLowerCase();

    // Check lockout
    const lock = failMap.get(key);
    if (lock && lock.until > Date.now()) {
      startLockCountdown(lock.until - Date.now());
      setErr(
        `Too many failed attempts. Try again in ${Math.ceil((lock.until - Date.now()) / 1000)}s`
      );
      return;
    }

    // Hash the entered password before comparing with stored hash
    const hashedInput = await hashPassword(password);
    const match = staff.find(
      s => s.u === key && s.p === hashedInput && s.active
    );

    if (match) {
      failMap.delete(key);
      onLogin({
        u: match.u,
        role: match.role,
        name: match.name,
        createdAt: Date.now(),
      });
    } else {
      const exists = staff.find(s => s.u === key);

      const prev = failMap.get(key) ?? { count: 0, until: 0 };
      const count = prev.count + 1;
      const until = count >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0;
      failMap.set(key, { count, until });

      if (until > 0) {
        startLockCountdown(LOCKOUT_MS);
        setErr('Too many failed attempts. Account locked for 30 seconds.');
      } else if (exists && !exists.active) {
        setErr('Account is inactive. Contact admin.');
      } else {
        const left = MAX_ATTEMPTS - count;
        setErr(
          `Invalid credentials${left <= 2 ? ` — ${left} attempt${left !== 1 ? 's' : ''} left` : ''}`
        );
      }
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') void go();
  };

  // LoginPage is only rendered AFTER App.tsx bootstrap is done.
  // So staff.length === 0 here means: migration not run / DB is empty, not "still loading".
  const noAccounts = staff.length === 0;

  return (
    <div
      style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}
    >
      {/* ── Left: Login form ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 380,
            animation: 'fadeUp .35s ease',
          }}
        >
          {/* Brand */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 40,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                background: 'var(--accent)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                boxShadow: '0 4px 12px rgba(232,98,10,.3)',
              }}
            >
              🔥
            </div>
            <div>
              <div
                style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)' }}
              >
                GasERP
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink3)' }}>
                Gas Agency Management
              </div>
            </div>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: 'var(--ink)',
                marginBottom: 6,
              }}
            >
              Welcome back
            </h2>
            <p style={{ fontSize: 14, color: 'var(--ink3)' }}>
              Sign in to your account to continue
            </p>
          </div>

          {noAccounts ? (
            /* ── No staff in DB or RLS blocking — show retry + instructions ── */
            <div
              style={{
                background: 'var(--amberbg)',
                border: '1px solid var(--amberbd)',
                borderRadius: 10,
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div
                style={{ fontSize: 14, fontWeight: 800, color: 'var(--amber)' }}
              >
                ⚠ No accounts found
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: 'var(--ink2)',
                  lineHeight: 1.6,
                }}
              >
                Either the database is empty or access is blocked (RLS).
                <br />
                Check the <strong>browser Console</strong> (F12) for the{' '}
                <code
                  style={{
                    background: 'var(--canvas)',
                    padding: '1px 4px',
                    borderRadius: 3,
                  }}
                >
                  [fetchAllStaff]
                </code>{' '}
                log line — it shows exactly what Supabase returned.
              </div>
              <div
                style={{ fontSize: 12, color: 'var(--ink3)', lineHeight: 1.8 }}
              >
                If it shows{' '}
                <code
                  style={{
                    background: 'var(--canvas)',
                    padding: '1px 4px',
                    borderRadius: 3,
                  }}
                >
                  data: []
                </code>
                , run this SQL in Supabase:
              </div>
              <pre
                style={{
                  margin: 0,
                  fontSize: 11,
                  background: 'var(--canvas)',
                  borderRadius: 6,
                  padding: '10px 12px',
                  color: 'var(--ink2)',
                  overflowX: 'auto',
                  border: '1px solid var(--border)',
                }}
              >{`drop policy if exists "anon_all" on staff;\ncreate policy "anon_all" on staff\n  for all to anon\n  using (true) with check (true);`}</pre>
              <Btn
                onClick={() => void retryFetch()}
                disabled={retrying}
                full
                style={{ marginTop: 4, fontSize: 13 }}
              >
                {retrying ? 'Retrying…' : '↺ Retry — fetch accounts again'}
              </Btn>
            </div>
          ) : (
            /* ── Login fields ── */
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
              onKeyDown={handleKey}
            >
              <Field
                label='Username'
                value={username}
                onChange={setUsername}
                placeholder='Enter username'
              />
              <Field
                label='Password'
                type='password'
                value={password}
                onChange={setPassword}
                placeholder='Enter password'
              />

              {err && (
                <div
                  style={{
                    background: 'var(--redbg)',
                    border: '1px solid var(--redbd)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    fontSize: 13,
                    color: 'var(--red)',
                    fontWeight: 600,
                  }}
                >
                  ⚠ {err}
                </div>
              )}

              {lockSecs > 0 && (
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
                  🔒 Try again in {lockSecs}s
                </div>
              )}

              <Btn
                onClick={() => void go()}
                disabled={lockSecs > 0}
                full
                style={{ padding: '11px', fontSize: 14, marginTop: 4 }}
              >
                Sign In →
              </Btn>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Decorative panel ── */}
      <div
        style={{
          width: 380,
          background:
            'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: 'rgba(232,98,10,.12)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -40,
            left: -40,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'rgba(232,98,10,.08)',
          }}
        />
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>⛽</div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#fff',
              marginBottom: 12,
            }}
          >
            Smart Gas Agency
          </div>
          <div
            style={{
              fontSize: 14,
              color: 'rgba(255,255,255,.5)',
              lineHeight: 1.6,
            }}
          >
            Complete ERP for billing, stock,
            <br />
            customers and monthly reports
          </div>
        </div>
      </div>
    </div>
  );
};
