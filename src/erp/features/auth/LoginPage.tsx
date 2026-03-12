import { useState, useRef, useEffect } from 'react';
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
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Manual retry — re-fetch staff from Supabase without full page reload
  const retryFetch = async () => {
    setRetrying(true);
    const result = await fetchAllStaff();
    console.log('[LoginPage] retry result:', result);
    if (result.length) setStaff(result);
    setRetrying(false);
    setInitialFetchDone(true);
  };

  // Auto-fetch staff on mount if store is empty (first load / no session)
  useEffect(() => {
    if (staff.length === 0) {
      void retryFetch();
    } else {
      setInitialFetchDone(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // noAccounts: only show the error block if we've finished the auto-fetch and still have nothing
  const isLoading = !initialFetchDone && staff.length === 0;
  const noAccounts = initialFetchDone && staff.length === 0;

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
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:40 }}>
            <div style={{
              width:52, height:52,
              background:'linear-gradient(145deg,#1e1008,#2d1800)',
              borderRadius:14, flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 6px 20px rgba(212,80,0,.38), 0 0 0 1px rgba(255,140,0,.28)',
            }}>
              <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
                <defs>
                  <linearGradient id="lsga-lp" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FFE566"/>
                    <stop offset="50%" stopColor="#FF9200"/>
                    <stop offset="100%" stopColor="#D44500"/>
                  </linearGradient>
                </defs>
                <path d="M16 2C11 8 7 13 7 18.5C7 24.5 11.1 30 16 30C20.9 30 25 24.5 25 18.5C25 13 21 8 16 2Z" fill="url(#lsga-lp)"/>
                <path d="M16 10C14.2 13.5 13 17 13.5 20.5C14 23.2 15 25.5 16 27C17 25.5 18 23.2 18.5 20.5C19 17 17.8 13.5 16 10Z" fill="rgba(255,255,255,0.42)"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize:18, fontWeight:800, color:'var(--ink)', lineHeight:1.15, letterSpacing:'-.02em' }}>
                Laxmi Srinivasa
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--accent)', lineHeight:1.3 }}>
                Gas Agency
              </div>
              <div style={{ fontSize:11, color:'var(--ink3)', marginTop:1 }}>
                Management System
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

          {isLoading ? (
            /* ── Auto-fetching staff — show spinner ── */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                padding: '32px 0',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  border: '3px solid var(--border)',
                  borderTopColor: 'var(--accent)',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                }}
              />
              <div style={{ fontSize: 13, color: 'var(--ink3)', fontWeight: 600 }}>
                Connecting to database…
              </div>
            </div>
          ) : noAccounts ? (
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

      {/* ── Right: Decorative panel (hidden on mobile via CSS) ── */}
      <div
        className="erp-login-right"
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
        <div style={{ position:'relative', textAlign:'center' }}>
          {/* Large decorative flame */}
          <div style={{ marginBottom:28 }}>
            <svg width="88" height="88" viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="lsga-panel" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFE566"/>
                  <stop offset="50%" stopColor="#FF9200"/>
                  <stop offset="100%" stopColor="#D44500"/>
                </linearGradient>
                <filter id="lsga-glow">
                  <feGaussianBlur stdDeviation="1.5" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              <path d="M16 2C11 8 7 13 7 18.5C7 24.5 11.1 30 16 30C20.9 30 25 24.5 25 18.5C25 13 21 8 16 2Z"
                fill="url(#lsga-panel)" filter="url(#lsga-glow)"/>
              <path d="M16 10C14.2 13.5 13 17 13.5 20.5C14 23.2 15 25.5 16 27C17 25.5 18 23.2 18.5 20.5C19 17 17.8 13.5 16 10Z"
                fill="rgba(255,255,255,0.45)"/>
            </svg>
          </div>
          <div style={{ fontSize:11, fontWeight:800, color:'rgba(255,200,80,.7)', letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:10 }}>
            Laxmi Srinivasa
          </div>
          <div style={{ fontSize:26, fontWeight:800, color:'#fff', marginBottom:14, lineHeight:1.1 }}>
            Gas Agency
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,.42)', lineHeight:1.75 }}>
            Complete ERP for billing, stock,<br/>
            customers &amp; monthly reports
          </div>
        </div>
      </div>
    </div>
  );
};
