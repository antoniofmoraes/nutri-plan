// macro-viz.jsx — macro visualization variants (ring, bars, numerals) + macro summary card

// Each macro slot: { label, value, target, color, key }
function macroSlots(totals, target) {
  return [
    { key: "cal", label: "Calorias",  value: totals.cal, target: target.cal, color: "var(--m-cal)",  unit: "kcal", icon: "flame" },
    { key: "p",   label: "Proteína",  value: totals.p,   target: target.p,   color: "var(--m-pro)",  unit: "g",    icon: "bolt" },
    { key: "c",   label: "Carbo.",    value: totals.c,   target: target.c,   color: "var(--m-carb)", unit: "g",    icon: "leaf" },
    { key: "f",   label: "Gordura",   value: totals.f,   target: target.f,   color: "var(--m-fat)",  unit: "g",    icon: "drop" },
  ];
}

// ── MacroCard ────────────────────────────────────────────────────
// One card per macro. Shows label, current/target, mini bar.
const MacroCard = ({ s }) => {
  const pct = Math.min(100, Math.round((s.value / s.target) * 100));
  return (
    <div className="card card-pad-sm" style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>{s.label}</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1 }}>
            {Math.round(s.value).toLocaleString("pt-BR")}
            <span style={{ color: "var(--muted)", fontSize: 13, marginLeft: 4 }}>
              / {s.target.toLocaleString("pt-BR")} {s.unit}
            </span>
          </div>
        </div>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: `color-mix(in oklab, ${s.color} 14%, transparent)`,
          color: s.color, display: "grid", placeItems: "center", flexShrink: 0,
        }}>
          <Icon name={s.icon} size={16} />
        </div>
      </div>
      <div style={{ height: 4, background: "var(--surface-alt)", borderRadius: 999, overflow: "hidden", marginBottom: 6 }}>
        <div style={{ width: pct + "%", height: "100%", background: s.color, borderRadius: 999, transition: "width .3s" }} />
      </div>
      <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)", display: "flex", justifyContent: "space-between" }}>
        <span>{pct}%</span>
        <span>{(s.target - s.value > 0 ? "−" : "+") + Math.abs(Math.round(s.target - s.value))}</span>
      </div>
    </div>
  );
};

const MacroCards = ({ totals, target }) => {
  const slots = macroSlots(totals, target);
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
      gap: 12,
    }}>
      {slots.map((s) => <MacroCard key={s.key} s={s} />)}
    </div>
  );
};

// ── MacroRing — donut chart ──────────────────────────────────────
// Donut, with calories in center. Three segments (P, C, F) by kcal share.
const MacroRing = ({ totals, target, size = 220 }) => {
  const r = (size - 28) / 2; // outer
  const tw = 18; // thickness
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  const kcalP = totals.p * 4;
  const kcalC = totals.c * 4;
  const kcalF = totals.f * 9;
  const totalKcal = Math.max(1, kcalP + kcalC + kcalF);
  const segs = [
    { key: "p", color: "var(--m-pro)",  share: kcalP / totalKcal, value: totals.p, label: "Proteína", target: target.p },
    { key: "c", color: "var(--m-carb)", share: kcalC / totalKcal, value: totals.c, label: "Carbo.",   target: target.c },
    { key: "f", color: "var(--m-fat)",  share: kcalF / totalKcal, value: totals.f, label: "Gordura",  target: target.f },
  ];

  // Build paths
  let offset = 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-alt)" strokeWidth={tw} />
          {segs.map((s) => {
            const len = s.share * circ;
            const dash = `${len} ${circ - len}`;
            const off = -offset;
            offset += len;
            return (
              <circle key={s.key}
                cx={cx} cy={cy} r={r}
                fill="none" stroke={s.color} strokeWidth={tw}
                strokeDasharray={dash}
                strokeDashoffset={off}
                strokeLinecap="butt"
                style={{ transition: "all .35s" }}
              />
            );
          })}
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center",
        }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Calorias</div>
            <div className="num" style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1 }}>
              {Math.round(totals.cal).toLocaleString("pt-BR")}
            </div>
            <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
              de {target.cal.toLocaleString("pt-BR")} kcal
            </div>
          </div>
        </div>
      </div>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
        {segs.map((s) => {
          const pct = Math.round(s.share * 100);
          return (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
              <span style={{ flex: 1, color: "var(--ink-2)" }}>{s.label}</span>
              <span className="num" style={{ color: "var(--muted)" }}>{Math.round(s.value)}g</span>
              <span className="num" style={{ color: "var(--muted)", width: 36, textAlign: "right" }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── MacroBars — stacked horizontal bar + per-macro bars ──────────
const MacroBars = ({ totals, target }) => {
  const slots = macroSlots(totals, target);
  const cal = slots[0];
  const pct = Math.min(100, Math.round((cal.value / cal.target) * 100));

  const kcalP = totals.p * 4;
  const kcalC = totals.c * 4;
  const kcalF = totals.f * 9;
  const tk = Math.max(1, kcalP + kcalC + kcalF);
  const segs = [
    { key: "p", color: "var(--m-pro)",  share: kcalP / tk, label: "P" },
    { key: "c", color: "var(--m-carb)", share: kcalC / tk, label: "C" },
    { key: "f", color: "var(--m-fat)",  share: kcalF / tk, label: "G" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Top: kcal headline + stacked bar */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Calorias</div>
            <div className="num" style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1 }}>
              {Math.round(cal.value).toLocaleString("pt-BR")}
              <span style={{ color: "var(--muted)", fontSize: 14, marginLeft: 6, fontWeight: 500 }}>
                / {cal.target.toLocaleString("pt-BR")}
              </span>
            </div>
          </div>
          <div className="num" style={{ fontSize: 13, color: "var(--muted)" }}>{pct}%</div>
        </div>
        <div style={{
          height: 14, display: "flex", borderRadius: 8, overflow: "hidden",
          background: "var(--surface-alt)", border: "1px solid var(--line)",
        }}>
          {segs.map((s) => (
            <div key={s.key} style={{ width: (s.share * 100) + "%", background: s.color, transition: "width .3s" }} />
          ))}
        </div>
        <div className="mono" style={{ display: "flex", gap: 14, marginTop: 8, color: "var(--muted)", fontSize: 11 }}>
          {segs.map((s) => (
            <span key={s.key} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 7, height: 7, background: s.color, borderRadius: 2 }} />
              {s.label} {Math.round(s.share * 100)}%
            </span>
          ))}
        </div>
      </div>

      {/* Per-macro: name, value/target, bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {slots.slice(1).map((s) => {
          const p = Math.min(100, Math.round((s.value / s.target) * 100));
          return (
            <div key={s.key}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{s.label}</span>
                <span className="num" style={{ fontSize: 13, color: "var(--ink-2)" }}>
                  {Math.round(s.value)}<span style={{ color: "var(--muted)" }}>/{s.target}{s.unit}</span>
                </span>
              </div>
              <div style={{ height: 6, background: "var(--surface-alt)", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ width: p + "%", height: "100%", background: s.color, borderRadius: 999, transition: "width .3s" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── MacroNumerals — minimal, large numbers with subtle progress underline ──
const MacroNumerals = ({ totals, target }) => {
  const slots = macroSlots(totals, target);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {slots.map((s, i) => {
        const pct = Math.min(100, (s.value / s.target) * 100);
        return (
          <div key={s.key} style={{
            paddingBottom: 16,
            borderBottom: i < slots.length - 1 ? "1px solid var(--line)" : "none",
          }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>{s.label}</div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <div className="num" style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1 }}>
                {Math.round(s.value).toLocaleString("pt-BR")}
              </div>
              <div className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>
                {Math.round(pct)}% · meta {s.target.toLocaleString("pt-BR")}{s.unit}
              </div>
            </div>
            <div style={{
              height: 2, marginTop: 10,
              background: "var(--surface-alt)", position: "relative",
            }}>
              <div style={{
                position: "absolute", inset: 0, width: pct + "%",
                background: s.color, transition: "width .3s",
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Inline macro line: "1,847 kcal · P 145g · C 198g · G 62g" ──
const MacroLine = ({ totals, compact, accent }) => {
  const f = (n) => Math.round(n);
  return (
    <div className="mono" style={{
      display: "inline-flex", gap: compact ? 10 : 14, fontSize: 11.5, color: "var(--muted)",
      flexWrap: "wrap", alignItems: "center",
    }}>
      <span style={{ color: accent ? "var(--ink)" : "var(--ink-2)" }}>
        {f(totals.cal)}<span style={{ color: "var(--muted)" }}> kcal</span>
      </span>
      <span><span style={{ color: "var(--m-pro)" }}>●</span> P {f(totals.p)}g</span>
      <span><span style={{ color: "var(--m-carb)" }}>●</span> C {f(totals.c)}g</span>
      <span><span style={{ color: "var(--m-fat)" }}>●</span> G {f(totals.f)}g</span>
    </div>
  );
};

Object.assign(window, {
  macroSlots,
  MacroCards, MacroRing, MacroBars, MacroNumerals, MacroLine,
});
