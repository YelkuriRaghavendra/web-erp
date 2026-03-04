// Global CSS injected once at the root ERP component
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg:#f5f4f1; --canvas:#fff; --sidebar:#1a1a2e; --border:#e8e5df; --border2:#d4d0c8;
  --accent:#e8620a; --accent2:#ff7a1a; --accentbg:#fff4ee; --accentbd:#fddcca;
  --ink:#1a1916; --ink2:#4a4640; --ink3:#9a9590;
  --green:#16a34a; --greenbg:#f0fdf4; --greenbd:#bbf7d0;
  --red:#dc2626; --redbg:#fef2f2; --redbd:#fecaca;
  --blue:#2563eb; --bluebg:#eff6ff; --bluebd:#bfdbfe;
  --amber:#d97706; --amberbg:#fffbeb; --amberbd:#fde68a;
  --purple:#7c3aed; --purplebg:#f5f3ff; --purplebd:#ddd6fe;
  --shadow:0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04);
  --shadow2:0 4px 16px rgba(0,0,0,.08),0 1px 3px rgba(0,0,0,.04);
  --shadow3:0 20px 60px rgba(0,0,0,.14),0 4px 16px rgba(0,0,0,.06);
}
body{background:var(--bg);color:var(--ink);font-family:'Plus Jakarta Sans',sans-serif;}
input,select,textarea,button{font-family:'Plus Jakarta Sans',sans-serif;}
::-webkit-scrollbar{width:5px;height:5px;}
::-webkit-scrollbar-track{background:var(--border);}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:99px;}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes scaleIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
.page-enter{animation:fadeUp .3s cubic-bezier(.22,1,.36,1) both;}
.modal-wrap{animation:fadeIn .2s ease both;}
.modal-box{animation:scaleIn .25s cubic-bezier(.22,1,.36,1) both;}
`;

export default CSS;
