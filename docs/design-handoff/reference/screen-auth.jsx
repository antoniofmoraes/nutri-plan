// screen-auth.jsx — Login + Register

const AuthShell = ({ side, children }) => (
  <div style={{
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    background: "var(--bg)",
  }} className="auth-shell">
    <style>{`
      @media (max-width: 900px) {
        .auth-shell { grid-template-columns: 1fr !important; }
        .auth-side  { display: none !important; }
      }
      .auth-side {
        background: var(--ink);
        color: var(--bg);
        padding: 56px;
        display: flex; flex-direction: column; justify-content: space-between;
        position: relative; overflow: hidden;
      }
      .auth-form-pane {
        padding: 56px 24px;
        display: grid; place-items: center;
      }
      .auth-card {
        width: 100%; max-width: 380px;
        display: flex; flex-direction: column; gap: 18px;
      }
    `}</style>
    {side === "left" && <AuthSide />}
    <div className="auth-form-pane">
      <div className="auth-card">{children}</div>
    </div>
    {side === "right" && <AuthSide />}
  </div>
);

const AuthSide = () => (
  <div className="auth-side">
    {/* Decorative pattern: large numerals */}
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.04, overflow: "hidden" }}>
      <div style={{ position: "absolute", fontFamily: "var(--font-mono)", fontSize: 480, fontWeight: 700,
                    top: -120, right: -80, color: "var(--bg)", lineHeight: 1 }}>2200</div>
    </div>
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Icon name="logo" size={28} style={{ color: "var(--accent)" }} />
        <div style={{ fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em" }}>
          PORTIO<span style={{ color: "var(--accent)" }}>.</span>
        </div>
      </div>
    </div>
    <div style={{ position: "relative", maxWidth: 480 }}>
      <div className="eyebrow" style={{ color: "color-mix(in oklab, var(--bg) 60%, transparent)", marginBottom: 14 }}>
        Plano · Refeições · Compras
      </div>
      <h1 className="h1" style={{ fontSize: 44, letterSpacing: "-0.025em", lineHeight: 1.05 }}>
        Sua nutrição,<br/>
        <span style={{ color: "var(--accent)", fontStyle: "italic", fontFamily: "var(--font-serif)", fontWeight: 400 }}>
          em proporções exatas.
        </span>
      </h1>
      <p style={{ color: "color-mix(in oklab, var(--bg) 72%, transparent)", marginTop: 18, lineHeight: 1.55, fontSize: 15 }}>
        PORTIO é uma ferramenta de planejamento — sem coach, sem tracker.
        Você desenha seu plano alimentar, monta refeições prontas e gera a lista
        de compras da semana em segundos.
      </p>
    </div>
    <div style={{ position: "relative", display: "flex", gap: 24, fontFamily: "var(--font-mono)", fontSize: 11,
                  color: "color-mix(in oklab, var(--bg) 60%, transparent)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
      <span>01 · Plano</span>
      <span>02 · Macros</span>
      <span>03 · Compras</span>
    </div>
  </div>
);

const LoginScreen = ({ onAuth, navigate }) => {
  const [email, setEmail] = React.useState("daniel@portio.app");
  const [pw, setPw] = React.useState("password");
  const [loading, setLoading] = React.useState(false);
  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); onAuth(); }, 700);
  };
  return (
    <AuthShell side="right">
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36 }}>
          <Icon name="logo" size={28} style={{ color: "var(--accent)" }} />
          <div style={{ fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em" }}>
            PORTIO<span style={{ color: "var(--accent)" }}>.</span>
          </div>
        </div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Acessar</div>
        <h1 className="h1" style={{ fontSize: 30 }}>Bem-vindo de volta.</h1>
        <p style={{ color: "var(--muted)", marginTop: 8, marginBottom: 0 }}>
          Entre na sua conta para continuar planejando.
        </p>
      </div>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Input icon="mail" label="Email" type="email"
               value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
        <Input icon="lock" label="Senha" type="password"
               value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
        <Button variant="acc" size="lg" type="submit"
                style={{ height: 44, fontSize: 14, marginTop: 6 }}>
          {loading ? <><span className="spin" /> Entrando…</> : <>Entrar <Icon name="arrow-r" size={15} /></>}
        </Button>
      </form>
      <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
        Não tem conta?{" "}
        <a href="#" onClick={(e) => { e.preventDefault(); navigate("register"); }}
           style={{ color: "var(--ink)", fontWeight: 500 }}>Cadastre-se</a>
      </div>
    </AuthShell>
  );
};

const RegisterScreen = ({ onAuth, navigate }) => {
  const [loading, setLoading] = React.useState(false);
  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); onAuth(); }, 700);
  };
  return (
    <AuthShell side="left">
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36 }}>
          <Icon name="logo" size={28} style={{ color: "var(--accent)" }} />
          <div style={{ fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em" }}>
            PORTIO<span style={{ color: "var(--accent)" }}>.</span>
          </div>
        </div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Criar conta</div>
        <h1 className="h1" style={{ fontSize: 30 }}>Comece em segundos.</h1>
        <p style={{ color: "var(--muted)", marginTop: 8, marginBottom: 0 }}>
          Nenhum cartão, nenhum coach. Só uma ferramenta limpa.
        </p>
      </div>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Input icon="user" label="Nome" type="text" defaultValue="Daniel Vieira" placeholder="Seu nome" />
        <Input icon="mail" label="Email" type="email" defaultValue="daniel@portio.app" placeholder="voce@email.com" />
        <Input icon="lock" label="Senha" type="password" defaultValue="passwd123" placeholder="••••••••" hint="Mínimo 6 caracteres." />
        <Button variant="acc" size="lg" type="submit" style={{ height: 44, fontSize: 14, marginTop: 6 }}>
          {loading ? <><span className="spin" /> Criando…</> : <>Criar conta <Icon name="arrow-r" size={15} /></>}
        </Button>
      </form>
      <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
        Já tem conta?{" "}
        <a href="#" onClick={(e) => { e.preventDefault(); navigate("login"); }}
           style={{ color: "var(--ink)", fontWeight: 500 }}>Entrar</a>
      </div>
    </AuthShell>
  );
};

Object.assign(window, { LoginScreen, RegisterScreen });
