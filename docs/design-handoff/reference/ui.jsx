// ui.jsx — atoms, sidebar, layout, dialogs, primitives

const cls = (...a) => a.filter(Boolean).join(" ");

// ── Inject reusable component styles ───────────────────────────────
const UI_STYLES = `
  /* Buttons */
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    font-family: var(--font-sans);
    font-weight: 500;
    font-size: 13.5px;
    padding: 0 14px;
    height: 36px;
    border-radius: var(--r-md);
    border: 1px solid transparent;
    cursor: pointer;
    transition: background .12s, border-color .12s, color .12s, transform .06s;
    white-space: nowrap;
    line-height: 1;
  }
  .btn:active { transform: translateY(0.5px); }
  .btn-pri { background: var(--ink); color: var(--bg); }
  .btn-pri:hover { background: var(--ink-2); }
  .btn-acc { background: var(--accent); color: var(--accent-ink); }
  .btn-acc:hover { filter: brightness(.96); }
  .btn-sec { background: var(--surface); color: var(--ink); border-color: var(--line); }
  .btn-sec:hover { background: var(--surface-alt); }
  .btn-ghost { background: transparent; color: var(--ink); }
  .btn-ghost:hover { background: var(--surface-alt); }
  .btn-danger { background: transparent; color: var(--danger); border-color: var(--line); }
  .btn-danger:hover { background: color-mix(in oklab, var(--danger) 10%, transparent); border-color: var(--danger); }
  .btn-sm { height: 30px; padding: 0 10px; font-size: 12.5px; gap: 6px; border-radius: 8px; }
  .btn-xs { height: 26px; padding: 0 8px; font-size: 11.5px; gap: 4px; border-radius: 6px; }
  .btn-icon { padding: 0; width: 36px; }
  .btn-icon.btn-sm { width: 30px; }
  .btn-icon.btn-xs { width: 26px; }

  /* Card */
  .card {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--r-lg);
    box-shadow: var(--shadow-1);
  }
  .card-pad { padding: 22px; }
  .card-pad-sm { padding: 16px; }

  /* Inputs */
  .field {
    display: block;
    width: 100%;
    height: 40px;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: var(--r-md);
    background: var(--surface);
    color: var(--ink);
    font-size: 14px;
    font-family: var(--font-sans);
    outline: none;
    transition: border-color .12s, background .12s;
  }
  .field:focus { border-color: var(--ink); }
  .field.with-icon { padding-left: 38px; }
  .field-wrap { position: relative; }
  .field-wrap .icn {
    position: absolute; left: 12px; top: 50%;
    transform: translateY(-50%);
    color: var(--muted);
    display: flex; align-items: center;
  }
  .label {
    font-size: 12px;
    font-weight: 500;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-family: var(--font-mono);
    display: block; margin-bottom: 6px;
  }

  /* Badge */
  .badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-family: var(--font-mono);
    font-size: 10.5px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 4px 8px;
    border-radius: 999px;
    border: 1px solid var(--line);
    color: var(--ink);
    background: var(--surface);
    line-height: 1;
  }
  .badge-solid { background: var(--ink); color: var(--bg); border-color: var(--ink); }
  .badge-accent { background: var(--accent-soft); color: var(--accent); border-color: transparent; }
  .badge-good { background: color-mix(in oklab, var(--good) 12%, transparent); color: var(--good); border-color: transparent; }
  .badge-warn { background: color-mix(in oklab, var(--warn) 14%, transparent); color: var(--warn); border-color: transparent; }
  .badge-cheat { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }

  /* Chip — food tag */
  .chip {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12.5px;
    padding: 5px 9px 5px 10px;
    border-radius: 8px;
    background: var(--surface-alt);
    border: 1px solid var(--line);
    color: var(--ink);
    white-space: nowrap;
  }
  .chip .q { font-family: var(--font-mono); font-size: 11px; color: var(--muted); }

  /* Headings */
  .h1 { font-size: 32px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; margin: 0; }
  .h2 { font-size: 22px; font-weight: 600; letter-spacing: -0.01em; margin: 0; }
  .h3 { font-size: 16px; font-weight: 600; margin: 0; }
  .eyebrow {
    font-family: var(--font-mono);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--muted);
    font-weight: 500;
  }

  /* Layout */
  .app-shell {
    display: grid;
    grid-template-columns: 256px 1fr;
    min-height: 100vh;
  }
  @media (max-width: 900px) { .app-shell { grid-template-columns: 1fr; } }

  .sidebar {
    border-right: 1px solid var(--line);
    background: var(--paper);
    height: 100vh;
    position: sticky;
    top: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  @media (max-width: 900px) {
    .sidebar { display: none; }
  }
  .sb-logo {
    padding: 22px 22px 18px;
    display: flex; align-items: center; gap: 10px;
    border-bottom: 1px solid var(--line);
  }
  .sb-logo .mark {
    font-weight: 700;
    font-size: 18px;
    letter-spacing: -0.02em;
  }
  .sb-logo .dot { color: var(--accent); }
  .sb-logo .tag-small {
    margin-left: auto;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border: 1px solid var(--line);
    padding: 3px 6px;
    border-radius: 4px;
  }
  .sb-nav {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    display: flex; flex-direction: column; gap: 2px;
  }
  .sb-section {
    font-family: var(--font-mono);
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted-2);
    padding: 14px 12px 6px;
  }
  .sb-item {
    display: flex; align-items: center; gap: 11px;
    padding: 10px 12px;
    border-radius: var(--r-md);
    color: var(--ink-2);
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    border: 1px solid transparent;
    background: transparent;
    text-align: left;
    width: 100%;
  }
  .sb-item:hover { background: var(--surface-alt); }
  .sb-item.active {
    background: var(--ink);
    color: var(--bg);
  }
  .sb-item .count {
    margin-left: auto;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--muted);
  }
  .sb-item.active .count { color: color-mix(in oklab, var(--bg) 70%, var(--ink)); }

  .sb-user {
    border-top: 1px solid var(--line);
    padding: 14px;
    display: flex; align-items: center; gap: 10px;
  }
  .sb-user .avatar {
    width: 36px; height: 36px;
    border-radius: 10px;
    background: var(--ink);
    color: var(--bg);
    display: grid; place-items: center;
    font-weight: 600;
    font-size: 12px;
    font-family: var(--font-mono);
    letter-spacing: 0.04em;
  }
  .sb-user .nm { font-size: 13px; font-weight: 500; line-height: 1.2; }
  .sb-user .em { font-size: 11px; color: var(--muted); font-family: var(--font-mono); }
  .sb-user .logout {
    margin-left: auto;
    background: transparent; border: 0;
    color: var(--muted); cursor: pointer;
    width: 30px; height: 30px;
    border-radius: 8px;
    display: grid; place-items: center;
  }
  .sb-user .logout:hover { background: var(--surface-alt); color: var(--ink); }

  /* Main content area */
  .main {
    min-width: 0;
  }
  .container {
    max-width: 1152px;
    margin: 0 auto;
    padding: 32px 40px 80px;
  }
  @media (max-width: 900px) {
    .container { padding: 16px 16px 80px; }
  }

  /* Mobile top bar */
  .mtop {
    display: none;
    position: sticky; top: 0; z-index: 10;
    height: 56px;
    padding: 0 14px;
    border-bottom: 1px solid var(--line);
    background: var(--bg);
    align-items: center; gap: 12px;
  }
  @media (max-width: 900px) {
    .mtop { display: flex; }
  }
  .mtop .mark { font-weight: 700; letter-spacing: -0.02em; }
  .mtop .mark .dot { color: var(--accent); }
  .mtop .hamb {
    width: 36px; height: 36px; border-radius: 8px;
    background: transparent; border: 1px solid var(--line);
    display: grid; place-items: center;
    color: var(--ink); cursor: pointer;
  }

  /* Drawer (mobile sidebar) */
  .drawer-backdrop {
    position: fixed; inset: 0;
    background: rgba(20,18,12,.4);
    z-index: 100;
    animation: fadeIn .15s ease;
  }
  .drawer {
    position: fixed; top: 0; bottom: 0; left: 0; width: 280px;
    background: var(--paper);
    border-right: 1px solid var(--line);
    z-index: 101;
    animation: slideIn .18s cubic-bezier(.3,.7,.4,1);
    display: flex; flex-direction: column;
  }
  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
  @keyframes slideIn { from { transform: translateX(-100%) } to { transform: translateX(0) } }

  /* Page header */
  .page-h {
    display: flex; align-items: flex-end; justify-content: space-between;
    gap: 16px;
    margin-bottom: 28px;
    flex-wrap: wrap;
  }
  .page-h .desc { color: var(--muted); margin-top: 8px; font-size: 14px; max-width: 56ch; }

  /* Tabs */
  .tabs {
    display: inline-flex;
    background: var(--surface-alt);
    border: 1px solid var(--line);
    border-radius: var(--r-md);
    padding: 3px;
    gap: 2px;
  }
  .tab {
    appearance: none; border: 0; background: transparent;
    padding: 6px 14px;
    border-radius: 7px;
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
    cursor: pointer;
    font-family: inherit;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .tab.active {
    background: var(--surface); color: var(--ink);
    box-shadow: var(--shadow-1);
  }
  .tab:hover:not(.active) { color: var(--ink); }

  /* Day tabs */
  .day-tabs {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;
    margin-bottom: 18px;
  }
  .day-tab {
    appearance: none; border: 1px solid var(--line); background: var(--surface);
    padding: 10px 8px;
    border-radius: var(--r-md);
    font-family: inherit;
    cursor: pointer;
    text-align: center;
    transition: background .12s, border-color .12s, color .12s;
  }
  .day-tab:hover { background: var(--surface-alt); }
  .day-tab.active {
    background: var(--ink); color: var(--bg); border-color: var(--ink);
  }
  .day-tab .dt-lbl { font-size: 13px; font-weight: 500; }
  .day-tab .dt-num { display: block; font-family: var(--font-mono); font-size: 11px; color: var(--muted); margin-top: 2px; }
  .day-tab.active .dt-num { color: color-mix(in oklab, var(--bg) 70%, var(--ink)); }

  /* Dropdown / Select */
  .dd {
    appearance: none;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--r-md);
    padding: 8px 36px 8px 14px;
    font-family: inherit; color: var(--ink); font-size: 13.5px; font-weight: 500;
    cursor: pointer;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='%237a766a' d='M0 0h10L5 6z'/></svg>");
    background-repeat: no-repeat;
    background-position: right 12px center;
  }

  /* Dialog */
  .dlg-backdrop {
    position: fixed; inset: 0;
    background: rgba(20,18,12,.45);
    z-index: 200;
    display: grid; place-items: center;
    padding: 24px;
    animation: fadeIn .12s ease;
  }
  .dlg {
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: var(--r-lg);
    max-width: 480px; width: 100%;
    box-shadow: var(--shadow-3);
    animation: pop .15s cubic-bezier(.3,.7,.4,1);
    max-height: calc(100vh - 80px);
    display: flex; flex-direction: column;
    overflow: hidden;
  }
  .dlg.lg { max-width: 640px; }
  @keyframes pop { from { opacity: 0; transform: scale(.97) } to { opacity: 1; transform: scale(1) } }
  .dlg-h {
    padding: 22px 24px 12px;
  }
  .dlg-h h2 { font-size: 18px; font-weight: 600; letter-spacing: -0.01em; margin: 0 0 4px; }
  .dlg-h p { font-size: 13.5px; color: var(--muted); margin: 0; }
  .dlg-b {
    padding: 6px 24px 20px;
    overflow-y: auto;
    display: flex; flex-direction: column; gap: 14px;
  }
  .dlg-f {
    padding: 14px 24px 20px;
    display: flex; justify-content: flex-end; gap: 8px;
    border-top: 1px solid var(--line);
    background: var(--surface);
  }

  /* Toast */
  .toast-region {
    position: fixed; bottom: 20px; right: 20px; z-index: 300;
    display: flex; flex-direction: column; gap: 10px;
    pointer-events: none;
  }
  .toast {
    background: var(--ink); color: var(--bg);
    padding: 12px 16px;
    border-radius: var(--r-md);
    font-size: 13px;
    display: flex; align-items: center; gap: 10px;
    box-shadow: var(--shadow-3);
    pointer-events: auto;
    animation: tIn .18s cubic-bezier(.3,.7,.4,1);
    max-width: 360px;
  }
  @keyframes tIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
  .toast.good .ic { color: #6ad07a; }
  .toast.err  .ic { color: #ff9080; }

  /* Skeleton spinner */
  .spin {
    width: 16px; height: 16px;
    border: 1.5px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin .8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Avatars */
  .av {
    display: grid; place-items: center;
    width: 32px; height: 32px;
    border-radius: 50%;
    background: var(--surface-alt);
    color: var(--ink);
    font-size: 11px;
    font-weight: 600;
    font-family: var(--font-mono);
    border: 1px solid var(--line);
    flex-shrink: 0;
  }
  .av-lg { width: 40px; height: 40px; font-size: 12px; }

  /* Search wrap */
  .search-wrap {
    position: relative;
    display: flex; align-items: center; gap: 8px;
  }
`;

const StyleInject = () => <style>{UI_STYLES}</style>;

// ── Button ────────────────────────────────────────────────────────
const Button = React.forwardRef(({ variant = "sec", size, icon, children, className, ...rest }, ref) => (
  <button
    ref={ref}
    className={cls("btn", "btn-" + variant, size && "btn-" + size, !children && "btn-icon", className)}
    {...rest}
  >
    {icon && <Icon name={icon} size={size === "xs" ? 14 : 16} />}
    {children}
  </button>
));

// ── Card ──────────────────────────────────────────────────────────
const Card = ({ className, pad = true, padSm = false, children, ...rest }) => (
  <div className={cls("card", pad && !padSm && "card-pad", padSm && "card-pad-sm", className)} {...rest}>
    {children}
  </div>
);

// ── Input ─────────────────────────────────────────────────────────
const Input = ({ icon, label, hint, error, ...rest }) => (
  <div>
    {label && <label className="label">{label}</label>}
    <div className="field-wrap">
      {icon && <span className="icn"><Icon name={icon} size={16} /></span>}
      <input className={cls("field", icon && "with-icon")} {...rest} />
    </div>
    {hint && !error && <div style={{fontSize:12, color:"var(--muted)", marginTop:6}}>{hint}</div>}
    {error && <div style={{fontSize:12, color:"var(--danger)", marginTop:6}}>{error}</div>}
  </div>
);

// ── Empty State ──────────────────────────────────────────────────
const EmptyState = ({ icon, title, body, action }) => (
  <Card className="empty" style={{display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", padding:"48px 32px"}}>
    <div style={{
      width: 56, height: 56, borderRadius: 14,
      background: "var(--accent-soft)", color: "var(--accent)",
      display: "grid", placeItems: "center",
      marginBottom: 16,
    }}>
      <Icon name={icon} size={26} />
    </div>
    <h3 className="h2" style={{ marginBottom: 6, fontSize: 19 }}>{title}</h3>
    <p style={{ color: "var(--muted)", maxWidth: 360, marginBottom: 22, marginTop: 0 }}>{body}</p>
    {action}
  </Card>
);

// ── Tabs (week/day) ──────────────────────────────────────────────
const Tabs = ({ value, onChange, options }) => (
  <div className="tabs">
    {options.map((o) => (
      <button key={o.value}
        className={cls("tab", value === o.value && "active")}
        onClick={() => onChange(o.value)}>
        {o.icon && <Icon name={o.icon} size={14} />}
        {o.label}
      </button>
    ))}
  </div>
);

// ── Day tabs (Seg/Ter/Qua...) ────────────────────────────────────
const DayTabs = ({ value, onChange, abbreviated }) => {
  const labels = abbreviated ? DAYS_LETTER : DAYS_SHORT;
  return (
    <div className="day-tabs">
      {DAYS.map((d, i) => (
        <button key={d} className={cls("day-tab", value === i && "active")}
                onClick={() => onChange(i)}>
          <span className="dt-lbl">{labels[i]}</span>
          {!abbreviated && <span className="dt-num">{String(i + 1).padStart(2, "0")}</span>}
        </button>
      ))}
    </div>
  );
};

// ── Dialog ───────────────────────────────────────────────────────
const Dialog = ({ open, onClose, title, description, children, footer, lg }) => {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="dlg-backdrop" onClick={onClose}>
      <div className={cls("dlg", lg && "lg")} onClick={(e) => e.stopPropagation()}>
        {(title || description) && (
          <div className="dlg-h">
            {title && <h2>{title}</h2>}
            {description && <p>{description}</p>}
          </div>
        )}
        <div className="dlg-b">{children}</div>
        {footer && <div className="dlg-f">{footer}</div>}
      </div>
    </div>
  );
};

// ── Toasts ───────────────────────────────────────────────────────
const ToastCtx = React.createContext({ push: () => {} });
const ToastProvider = ({ children }) => {
  const [items, setItems] = React.useState([]);
  const push = React.useCallback((msg, opts = {}) => {
    const id = Math.random().toString(36).slice(2);
    setItems((s) => [...s, { id, msg, ...opts }]);
    setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 2800);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="toast-region">
        {items.map((t) => (
          <div key={t.id} className={cls("toast", t.kind === "error" && "err", t.kind === "good" && "good")}>
            <span className="ic"><Icon name={t.kind === "error" ? "alert" : "check"} size={16} /></span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
};
const useToast = () => React.useContext(ToastCtx);

// ── Sidebar ──────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", label: "Dashboard",         icon: "dashboard" },
  { id: "plans",     label: "Planos alimentares", icon: "plans" },
  { id: "foods",     label: "Alimentos",          icon: "foods" },
  { id: "presets",   label: "Refeições prontas",   icon: "presets" },
  { id: "shopping",  label: "Listas de compras",   icon: "shopping" },
];

const SidebarBody = ({ route, navigate, onLogout, planCount, foodCount }) => (
  <>
    <div className="sb-logo">
      <Icon name="logo" size={26} style={{ color: "var(--accent)" }} />
      <div className="mark">PORTIO<span className="dot">.</span></div>
      <div className="tag-small">v0.1</div>
    </div>
    <div className="sb-nav">
      <div className="sb-section">Planejamento</div>
      {NAV.map((n) => (
        <button key={n.id} className={cls("sb-item", route === n.id && "active")}
                onClick={() => navigate(n.id)}>
          <Icon name={n.icon} size={18} />
          <span>{n.label}</span>
          {n.id === "plans" && planCount != null && <span className="count">{planCount}</span>}
          {n.id === "foods" && foodCount != null && <span className="count">{foodCount}</span>}
        </button>
      ))}
    </div>
    <div className="sb-user">
      <div className="avatar">{USER.initials}</div>
      <div>
        <div className="nm">{USER.name}</div>
        <div className="em">{USER.email}</div>
      </div>
      <button className="logout" title="Sair" onClick={onLogout}>
        <Icon name="logout" size={16} />
      </button>
    </div>
  </>
);

const Sidebar = (props) => (
  <aside className="sidebar">
    <SidebarBody {...props} />
  </aside>
);

const MobileTop = ({ onMenu }) => (
  <div className="mtop">
    <button className="hamb" onClick={onMenu}><Icon name="menu" size={18} /></button>
    <div className="mark">
      <Icon name="logo" size={20} style={{verticalAlign:"-4px", marginRight:6, color:"var(--accent)"}} />
      PORTIO<span className="dot">.</span>
    </div>
  </div>
);

const Drawer = ({ open, onClose, ...rest }) => {
  if (!open) return null;
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer">
        <SidebarBody {...rest} navigate={(r) => { rest.navigate(r); onClose(); }} />
      </div>
    </>
  );
};

Object.assign(window, {
  cls, StyleInject,
  Button, Card, Input, EmptyState,
  Tabs, DayTabs, Dialog,
  ToastProvider, useToast,
  Sidebar, MobileTop, Drawer, NAV,
});
