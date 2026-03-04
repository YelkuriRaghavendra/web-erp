import { useLocation, useNavigate } from 'react-router-dom';
import { NAV } from '../../core/constants';
import type { ERPUser } from '../../core/types';

interface Props {
  user:     ERPUser;
  onLogout: () => void;
}

export const Sidebar = ({ user, onLogout }: Props) => {
  const location = useLocation();
  const navigate  = useNavigate();
  const allowed   = NAV.filter(n => n.roles.includes(user.role));

  return (
    <div style={{ width:220, background:'var(--sidebar)', display:'flex', flexDirection:'column',
      height:'100vh', position:'sticky', top:0, flexShrink:0 }}>

      {/* Logo */}
      <div style={{ padding:'24px 20px 20px', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:38, height:38,
            background:'linear-gradient(145deg,#1e1008,#2d1800)',
            borderRadius:10, flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 3px 10px rgba(0,0,0,.5), 0 0 0 1px rgba(255,140,0,.2)',
          }}>
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="lsga-sb" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFE566"/>
                  <stop offset="50%" stopColor="#FF9200"/>
                  <stop offset="100%" stopColor="#D44500"/>
                </linearGradient>
              </defs>
              <path d="M16 2C11 8 7 13 7 18.5C7 24.5 11.1 30 16 30C20.9 30 25 24.5 25 18.5C25 13 21 8 16 2Z" fill="url(#lsga-sb)"/>
              <path d="M16 10C14.2 13.5 13 17 13.5 20.5C14 23.2 15 25.5 16 27C17 25.5 18 23.2 18.5 20.5C19 17 17.8 13.5 16 10Z" fill="rgba(255,255,255,0.42)"/>
            </svg>
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:12.5, fontWeight:800, color:'#fff', letterSpacing:'-.02em', lineHeight:1.2 }}>Laxmi Srinivasa</div>
            <div style={{ fontSize:10, color:'rgba(255,200,100,.6)', fontWeight:600 }}>Gas Agency</div>
          </div>
        </div>
      </div>

      {/* Nav links — only pages the user's role can access */}
      <nav style={{ flex:1, padding:'12px 10px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto' }}>
        {allowed.map(n => {
          const active = location.pathname === n.path;
          return (
            <button
              key={n.id}
              onClick={() => navigate(n.path)}
              style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'9px 12px', borderRadius:8, border:'none', cursor:'pointer',
                fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:13.5,
                fontWeight: active ? 700 : 500, textAlign:'left', width:'100%',
                background: active ? 'rgba(232,98,10,.18)' : 'transparent',
                color: active ? '#ff9a5c' : 'rgba(255,255,255,.52)',
                transition:'all .15s',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background='rgba(255,255,255,.06)'; e.currentTarget.style.color='rgba(255,255,255,.85)'; }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,.52)'; }}}
            >
              <span style={{ fontSize:16, opacity: active ? 1 : .7 }}>{n.icon}</span>
              {n.label}
              {active && <div style={{ marginLeft:'auto', width:4, height:4, borderRadius:99, background:'var(--accent2)' }}/>}
            </button>
          );
        })}
      </nav>

      {/* User chip + logout */}
      <div style={{ padding:'12px 10px', borderTop:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ padding:'10px 12px', borderRadius:8, background:'rgba(255,255,255,.05)', marginBottom:8 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{user.name}</div>
          <div style={{ fontSize:11, color:'var(--accent2)', marginTop:1 }}>{user.role}</div>
        </div>
        <button
          onClick={onLogout}
          style={{ width:'100%', padding:'8px', borderRadius:8, background:'transparent',
            border:'1px solid rgba(255,255,255,.1)', color:'rgba(255,255,255,.45)',
            fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,.06)'; e.currentTarget.style.color='rgba(255,255,255,.8)'; }}
          onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,.45)'; }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
};
