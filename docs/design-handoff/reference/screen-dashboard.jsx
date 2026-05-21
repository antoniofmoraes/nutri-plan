// screen-dashboard.jsx — Dashboard with macro viz variants + meal card variants

// ── Meal card variants ───────────────────────────────────────────
const MealCardList = ({ slot, meal, foods }) => {
  const totals = sumMacros(meal.items);
  return (
    <div className="card card-pad-sm">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, fontSize: 14.5 }}>{slot.name}</span>
          <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{slot.time}</span>
          {meal.cheat && <span className="badge badge-cheat">Livre</span>}
        </div>
        {!meal.cheat && <MacroLine totals={totals} compact />}
      </div>
      {meal.cheat ? (
        <div className="mono" style={{ fontSize: 12, color: "var(--muted)", padding: "8px 0" }}>
          Refeição livre · macros não contabilizados.
        </div>
      ) : meal.items.length === 0 ? (
        <div className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>Nenhum alimento.</div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {meal.items.map((it, i) => {
            const f = foodById(it.foodId);
            return (
              <span key={i} className="chip">
                {f.name} <span className="q">{it.qty}g</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MealCardCompact = ({ slot, meal, foods }) => {
  const totals = sumMacros(meal.items);
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 14, alignItems: "center",
      padding: "14px 16px",
      borderBottom: "1px solid var(--line)",
    }}>
      <div className="mono" style={{ fontSize: 11, color: "var(--muted)", textAlign: "right", width: 48 }}>{slot.time}</div>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 13.5 }}>{slot.name}</span>
          {meal.cheat && <span className="badge badge-cheat">Livre</span>}
        </div>
        {!meal.cheat && (
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3, lineHeight: 1.4 }}>
            {meal.items.map((it) => foodById(it.foodId).name).join(" · ")}
          </div>
        )}
      </div>
      {!meal.cheat && (
        <div className="num" style={{ fontSize: 13, color: "var(--ink-2)", textAlign: "right" }}>
          {Math.round(totals.cal)}<span style={{ color: "var(--muted)", fontSize: 11 }}> kcal</span>
        </div>
      )}
    </div>
  );
};

const MealCardTimeline = ({ slot, meal, foods, isFirst, isLast }) => {
  const totals = sumMacros(meal.items);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "78px 1fr", gap: 0 }}>
      {/* Left rail with time + connector */}
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 6 }}>
        <div className="mono" style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 8, fontWeight: 500 }}>{slot.time}</div>
        <div style={{
          width: 10, height: 10, borderRadius: 50, background: meal.cheat ? "var(--accent)" : "var(--ink)",
          border: "3px solid var(--bg)", zIndex: 1,
        }} />
        {!isLast && <div style={{ width: 1, flex: 1, background: "var(--line)", marginTop: 2 }} />}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : 22 }}>
        <div className="card card-pad-sm">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: meal.items.length || meal.cheat ? 10 : 0, gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 14.5 }}>{slot.name}</span>
              {meal.cheat && <span className="badge badge-cheat">Livre</span>}
            </div>
            {!meal.cheat && <MacroLine totals={totals} compact />}
          </div>
          {meal.cheat ? null : meal.items.length === 0 ? (
            <div className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>Nenhum alimento.</div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {meal.items.map((it, i) => {
                const f = foodById(it.foodId);
                return <span key={i} className="chip">{f.name} <span className="q">{it.qty}g</span></span>;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MealCard = ({ variant, ...rest }) => {
  if (variant === "compact") return <MealCardCompact {...rest} />;
  if (variant === "timeline") return <MealCardTimeline {...rest} />;
  return <MealCardList {...rest} />;
};

// ── DashboardScreen ──────────────────────────────────────────────
const DashboardScreen = ({ plans, navigate }) => {
  const [planId, setPlanId] = React.useState(plans.find((p) => p.main)?.id || plans[0]?.id);
  const plan = plans.find((p) => p.id === planId) || plans[0];

  const todayIdx = (new Date().getDay() + 6) % 7; // make Mon=0
  const [day, setDay] = React.useState(todayIdx);

  const [macroVis, setMacroVis] = React.useState("ring"); // ring | bars | numerals
  const [mealVariant, setMealVariant] = React.useState("list"); // list | timeline | compact

  // Compute totals for the day
  const dayMeals = plan?.week?.[day] || {};
  const dayItems = plan?.slots?.flatMap((sl) => {
    const m = dayMeals[sl.id];
    if (!m || m.cheat) return [];
    return m.items;
  }) || [];
  const totals = sumMacros(dayItems);

  if (!plan) {
    return (
      <EmptyState icon="plans" title="Nenhum plano alimentar"
        body="Crie seu primeiro plano para começar a planejar suas refeições da semana."
        action={<Button variant="acc" icon="plus" onClick={() => navigate("plans")}>Criar primeiro plano</Button>} />
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-h">
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            {DAYS[todayIdx]} · {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
          </div>
          <h1 className="h1">
            Olá, {USER.firstName}.
            <span style={{ display: "block", color: "var(--muted)", fontWeight: 500, fontSize: 18, marginTop: 6, letterSpacing: 0 }}>
              Aqui está sua semana.
            </span>
          </h1>
        </div>
        <select className="dd" value={planId} onChange={(e) => setPlanId(e.target.value)}>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Day tabs */}
      <DayTabs value={day} onChange={setDay} />

      {/* Macro section: viz selector + viz */}
      <div className="card" style={{ padding: 0, marginBottom: 20, overflow: "hidden" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 22px", borderBottom: "1px solid var(--line)", gap: 10, flexWrap: "wrap",
        }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Macros · {DAYS[day]}</div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>
              Meta diária <span className="mono" style={{ color: "var(--muted)", fontSize: 12, fontWeight: 500 }}>
                · {plan.target.cal.toLocaleString("pt-BR")} kcal · {plan.goal}
              </span>
            </div>
          </div>
          <Tabs value={macroVis} onChange={setMacroVis}
            options={[
              { value: "ring",     label: "Anel" },
              { value: "bars",     label: "Barras" },
              { value: "numerals", label: "Números" },
            ]} />
        </div>
        <div style={{ padding: 22 }}>
          {macroVis === "ring" && (
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 32, alignItems: "center" }} className="ring-grid">
              <style>{`@media(max-width:780px){.ring-grid{grid-template-columns:1fr !important}}`}</style>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <MacroRing totals={totals} target={plan.target} size={240} />
              </div>
              <MacroCards totals={totals} target={plan.target} />
            </div>
          )}
          {macroVis === "bars" && <MacroBars totals={totals} target={plan.target} />}
          {macroVis === "numerals" && (
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 40, alignItems: "start" }} className="num-grid">
              <style>{`@media(max-width:780px){.num-grid{grid-template-columns:1fr !important; gap: 20px !important}}`}</style>
              <MacroNumerals totals={totals} target={plan.target} />
              <div style={{
                background: "var(--surface-alt)", borderRadius: "var(--r-md)",
                padding: 18, border: "1px solid var(--line)",
              }}>
                <div className="eyebrow" style={{ marginBottom: 14 }}>Distribuição calórica</div>
                {(() => {
                  const kP = totals.p * 4, kC = totals.c * 4, kF = totals.f * 9;
                  const tk = Math.max(1, kP + kC + kF);
                  const rows = [
                    { lbl: "Proteína", v: kP, color: "var(--m-pro)" },
                    { lbl: "Carbo.",   v: kC, color: "var(--m-carb)" },
                    { lbl: "Gordura",  v: kF, color: "var(--m-fat)" },
                  ];
                  return rows.map((r) => {
                    const pct = (r.v / tk) * 100;
                    return (
                      <div key={r.lbl} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 13 }}>{r.lbl}</span>
                          <span className="num" style={{ fontSize: 12, color: "var(--muted)" }}>
                            {Math.round(pct)}% · {Math.round(r.v)} kcal
                          </span>
                        </div>
                        <div style={{ height: 6, background: "var(--surface)", borderRadius: 999, overflow: "hidden" }}>
                          <div style={{ width: pct + "%", height: "100%", background: r.color, borderRadius: 999 }} />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Meals section */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 14, gap: 12, flexWrap: "wrap",
      }}>
        <div>
          <h2 className="h2">Refeições de {DAYS[day].toLowerCase()}</h2>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4, marginBottom: 0 }}>
            {plan.slots.length} refeições · {Object.values(dayMeals).filter((m) => m && !m.cheat).reduce((a, m) => a + m.items.length, 0)} alimentos
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Tabs value={mealVariant} onChange={setMealVariant}
            options={[
              { value: "list",     label: "Lista",     icon: "list" },
              { value: "timeline", label: "Timeline",  icon: "clock" },
              { value: "compact",  label: "Compacto",  icon: "grid" },
            ]} />
          <Button variant="sec" icon="edit" size="sm" onClick={() => navigate("plan-detail", { id: plan.id })}>
            Editar
          </Button>
        </div>
      </div>

      {mealVariant === "compact" ? (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {plan.slots.map((sl, i) => {
            const meal = dayMeals[sl.id] || { cheat: false, items: [] };
            return <MealCard key={sl.id} variant="compact" slot={sl} meal={meal} foods={FOODS} />;
          })}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: mealVariant === "timeline" ? 0 : 10 }}>
          {plan.slots.map((sl, i) => {
            const meal = dayMeals[sl.id] || { cheat: false, items: [] };
            return (
              <MealCard key={sl.id}
                variant={mealVariant}
                slot={sl} meal={meal} foods={FOODS}
                isFirst={i === 0} isLast={i === plan.slots.length - 1} />
            );
          })}
        </div>
      )}
    </div>
  );
};

Object.assign(window, { DashboardScreen, MealCard });
