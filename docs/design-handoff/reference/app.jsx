// app.jsx — root app, routing, theme + tweaks wiring

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "ember",
  "type": "grotesk",
  "dark": false,
  "frame": "fluid"
}/*EDITMODE-END*/;

const PALETTES = [
  { id: "ember",  colors: ["#ff4d2e", "#15140f", "#f7f4ec"] },
  { id: "moss",   colors: ["#2d6a3a", "#15140f", "#f7f4ec"] },
  { id: "cobalt", colors: ["#1a3df0", "#15140f", "#f7f4ec"] },
  { id: "ink",    colors: ["#15140f", "#f7f4ec", "#e2dccd"] },
];

const App = () => {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = React.useState({ name: "dashboard", params: {} });
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [auth, setAuth] = React.useState(true);

  // Live state
  const [plans, setPlans] = React.useState(PLANS);
  const [foods, setFoods] = React.useState(FOODS);
  const [presets, setPresets] = React.useState(PRESETS);
  const [lists, setLists] = React.useState(SHOPPING_LISTS);

  const navigate = React.useCallback((name, params = {}) => {
    setRoute({ name, params });
    window.scrollTo(0, 0);
  }, []);

  // Apply theme/palette/type attributes to root
  React.useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme",   t.dark ? "dark" : "light");
    root.setAttribute("data-palette", t.palette || "ember");
    root.setAttribute("data-type",    t.type || "grotesk");
  }, [t.dark, t.palette, t.type]);

  const onAuth = () => { setAuth(true); navigate("dashboard"); };
  const onLogout = () => { setAuth(false); navigate("login"); };

  // Unauth flow
  if (!auth) {
    return (
      <>
        <StyleInject />
        {route.name === "register"
          ? <RegisterScreen onAuth={onAuth} navigate={navigate} />
          : <LoginScreen onAuth={onAuth} navigate={navigate} />}
        <TweaksUI t={t} setTweak={setTweak} compact />
      </>
    );
  }

  // App shell
  let screen;
  switch (route.name) {
    case "dashboard":
      screen = <DashboardScreen plans={plans} navigate={navigate} />;
      break;
    case "plans":
      screen = <PlansScreen plans={plans} setPlans={setPlans} navigate={navigate} />;
      break;
    case "plan-detail":
      screen = <PlanDetailScreen planId={route.params.id} plans={plans} setPlans={setPlans} navigate={navigate} />;
      break;
    case "foods":
      screen = <FoodsScreen foods={foods} setFoods={setFoods} />;
      break;
    case "presets":
      screen = <PresetsScreen presets={presets} setPresets={setPresets} />;
      break;
    case "shopping":
      screen = <ShoppingListsScreen lists={lists} setLists={setLists} navigate={navigate} />;
      break;
    case "shopping-detail":
      screen = <ShoppingDetailScreen listId={route.params.id} lists={lists} setLists={setLists} plans={plans} navigate={navigate} />;
      break;
    default:
      screen = <DashboardScreen plans={plans} navigate={navigate} />;
  }

  // Mobile frame mode
  const inFrame = t.frame === "mobile";

  const sidebarProps = {
    route: route.name === "plan-detail" ? "plans"
         : route.name === "shopping-detail" ? "shopping" : route.name,
    navigate, onLogout, planCount: plans.length, foodCount: foods.length,
  };

  return (
    <>
      <StyleInject />
      <ToastProvider>
        <FrameWrapper inFrame={inFrame}>
          <div className="app-shell">
            <Sidebar {...sidebarProps} />
            <main className="main">
              <MobileTop onMenu={() => setDrawerOpen(true)} />
              <div className="container">{screen}</div>
            </main>
          </div>
          <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} {...sidebarProps} />
        </FrameWrapper>
        <TweaksUI t={t} setTweak={setTweak} />
      </ToastProvider>
    </>
  );
};

// ── Mobile frame wrapper (visual phone frame for review) ────────
const FrameWrapper = ({ inFrame, children }) => {
  if (!inFrame) return children;
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #1a1813 0%, #0e0d0a 100%)",
      display: "grid", placeItems: "center", padding: "24px",
    }}>
      <style>{`
        .phone-frame {
          width: 412px; height: 844px;
          border-radius: 48px;
          background: #15140f;
          padding: 14px;
          box-shadow: 0 30px 80px rgba(0,0,0,.5), inset 0 0 0 1px rgba(255,255,255,.05);
          position: relative;
        }
        .phone-frame .screen {
          width: 100%; height: 100%;
          border-radius: 34px;
          overflow: auto; overflow-x: hidden;
          background: var(--bg);
          position: relative;
        }
        .phone-frame .notch {
          position: absolute;
          top: 22px; left: 50%; transform: translateX(-50%);
          width: 110px; height: 30px;
          background: #000;
          border-radius: 999px;
          z-index: 100;
        }
        .phone-frame .screen .app-shell { grid-template-columns: 1fr !important; }
        .phone-frame .screen .sidebar { display: none !important; }
        .phone-frame .screen .mtop { display: flex !important; }
        .phone-frame .screen .container { padding: 16px 14px 80px !important; }
        .phone-frame .screen .page-h .h1 { font-size: 24px !important; }
        .phone-frame .screen .ring-grid { grid-template-columns: 1fr !important; }
        .phone-frame .screen .num-grid { grid-template-columns: 1fr !important; }
      `}</style>
      <div className="phone-frame">
        <div className="notch"></div>
        <div className="screen">{children}</div>
      </div>
    </div>
  );
};

// ── Tweaks UI ───────────────────────────────────────────────────
const TweaksUI = ({ t, setTweak, compact }) => (
  <TweaksPanel title="Tweaks · PORTIO">
    <TweakSection label="Tema">
      <TweakToggle label="Modo escuro" value={t.dark} onChange={(v) => setTweak("dark", v)} />
    </TweakSection>
    <TweakSection label="Paleta">
      <PaletteSwatches value={t.palette} onChange={(v) => setTweak("palette", v)} />
    </TweakSection>
    <TweakSection label="Tipografia">
      <TweakRadio label="Pareamento" value={t.type}
        options={[
          { value: "grotesk", label: "Grotesk" },
          { value: "plex",    label: "Plex" },
          { value: "serif",   label: "+ Serif" },
        ]}
        onChange={(v) => setTweak("type", v)} />
    </TweakSection>
    {!compact && (
      <TweakSection label="Visualização">
        <TweakRadio label="Tela" value={t.frame}
          options={[
            { value: "fluid", label: "Desktop" },
            { value: "mobile", label: "Mobile" },
          ]}
          onChange={(v) => setTweak("frame", v)} />
      </TweakSection>
    )}
  </TweaksPanel>
);

// Custom palette swatch picker so the swatch grid actually maps named ids → colors
const PaletteSwatches = ({ value, onChange }) => {
  const opts = [
    { id: "ember",  name: "Ember",  colors: ["#ff4d2e", "#15140f", "#efeadf"] },
    { id: "moss",   name: "Moss",   colors: ["#2d6a3a", "#15140f", "#efeadf"] },
    { id: "cobalt", name: "Cobalt", colors: ["#1a3df0", "#15140f", "#efeadf"] },
    { id: "ink",    name: "Ink",    colors: ["#15140f", "#e2dccd", "#efeadf"] },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
      {opts.map((o) => {
        const on = value === o.id;
        return (
          <button key={o.id} onClick={() => onChange(o.id)}
                  title={o.name}
                  style={{
                    appearance: "none", border: 0, padding: 0,
                    background: "transparent", cursor: "pointer",
                    position: "relative", height: 36, borderRadius: 6,
                    overflow: "hidden",
                    boxShadow: on
                      ? "0 0 0 1.5px rgba(0,0,0,.85), 0 2px 6px rgba(0,0,0,.15)"
                      : "0 0 0 .5px rgba(0,0,0,.12), 0 1px 2px rgba(0,0,0,.06)",
                  }}>
            <div style={{ display: "flex", height: "100%" }}>
              {o.colors.map((c, i) => (
                <div key={i} style={{ flex: i === 0 ? 2 : 1, background: c }} />
              ))}
            </div>
            <div style={{
              position: "absolute", left: 6, bottom: 4,
              fontFamily: "ui-sans-serif", fontSize: 9, fontWeight: 600,
              color: "rgba(255,255,255,.95)", textShadow: "0 1px 2px rgba(0,0,0,.5)",
              letterSpacing: "0.04em", textTransform: "uppercase",
            }}>{o.name}</div>
            {on && (
              <div style={{
                position: "absolute", top: 4, right: 4,
                width: 14, height: 14, borderRadius: 50,
                background: "rgba(255,255,255,.95)",
                display: "grid", placeItems: "center",
              }}>
                <svg width="9" height="9" viewBox="0 0 14 14">
                  <path d="M3 7.2 5.8 10 11 4.2" fill="none" stroke="rgba(0,0,0,.85)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
