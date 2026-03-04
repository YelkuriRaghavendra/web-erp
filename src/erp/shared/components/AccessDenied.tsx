// Shown when a user navigates to a page their role cannot access
export const AccessDenied = () => (
  <div style={{
    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
    height:'60vh', gap:16, color:'var(--ink3)',
  }}>
    <div style={{ fontSize:48 }}>🚫</div>
    <div style={{ fontSize:18, fontWeight:700, color:'var(--ink)' }}>Access Denied</div>
    <div style={{ fontSize:13 }}>You don't have permission to view this page.</div>
  </div>
);
