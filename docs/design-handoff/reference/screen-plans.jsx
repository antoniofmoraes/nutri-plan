// screen-plans.jsx — Meal plans list

const GOAL_STYLE = {
  "Manutenção":      { bg: "color-mix(in oklab, var(--m-pro) 14%, transparent)", fg: "var(--m-pro)" },
  "Emagrecimento":   { bg: "color-mix(in oklab, var(--m-cal) 14%, transparent)", fg: "var(--m-cal)" },
  "Ganho de Massa":  { bg: "color-mix(in oklab, var(--m-fat) 14%, transparent)", fg: "var(--m-fat)" },
};

const PlanCard = ({ plan, onOpen, onSetMain, onDelete, onEdit }) => {
  const s = GOAL_STYLE[plan.goal] || GOAL_STYLE["Manutenção"];
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", cursor: "pointer", transition: "transform .08s, box-shadow .12s" }}
         onClick={onOpen}
         onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-2)"; }}
         onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-1)"; }}>
      <div style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <span className="badge" style={{ background: s.bg, color: s.fg, border: "0" }}>{plan.goal}</span>
          {plan.main ? (
            <span title="Plano principal" style={{ color: "var(--accent)", display: "flex" }}>
              <Icon name="star-f" size={18} />
            </span>
          ) : (
            <button className="btn btn-ghost btn-icon btn-sm"
                    onClick={(e) => { e.stopPropagation(); onSetMain(); }}
                    title="Tornar principal">
              <Icon name="star" size={16} />
            </button>
          )}
        </div>
        <h3 className="h2" style={{ fontSize: 18, marginBottom: 4 }}>{plan.name}</h3>
        <div className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>
          ~{plan.target.cal.toLocaleString("pt-BR")} kcal/dia · {plan.slots.length} refeições
        </div>
      </div>
      <div style={{
        borderTop: "1px solid var(--line)",
        background: "var(--surface-alt)",
        padding: "10px 14px",
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
      }}>
        <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)", display: "flex", gap: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          <span>P · {plan.target.p}</span>
          <span>C · {plan.target.c}</span>
          <span>G · {plan.target.f}</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button className="btn btn-ghost btn-xs btn-icon" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <Icon name="edit" size={14} />
          </button>
          <button className="btn btn-ghost btn-xs btn-icon" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Icon name="trash" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const NewPlanDialog = ({ open, onClose, onCreate }) => {
  const [name, setName] = React.useState("");
  const [goal, setGoal] = React.useState("Manutenção");
  const [cal, setCal]   = React.useState(2200);
  const [p, setP] = React.useState(165);
  const [c, setC] = React.useState(240);
  const [f, setF] = React.useState(70);
  const submit = () => {
    if (!name.trim()) return;
    onCreate({ name, goal, target: { cal: +cal, p: +p, c: +c, f: +f } });
    setName(""); onClose();
  };
  return (
    <Dialog open={open} onClose={onClose} title="Novo plano alimentar"
            description="Defina meta calórica e macros. Você pode editar depois."
            footer={<>
              <Button variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button variant="acc" onClick={submit}>Criar plano</Button>
            </>}>
      <Input label="Nome" placeholder="Ex: Cutting março" value={name}
             onChange={(e) => setName(e.target.value)} />
      <div>
        <label className="label">Objetivo</label>
        <select className="dd" style={{ width: "100%", height: 40 }} value={goal} onChange={(e) => setGoal(e.target.value)}>
          <option>Emagrecimento</option>
          <option>Manutenção</option>
          <option>Ganho de Massa</option>
        </select>
      </div>
      <Input label="Calorias diárias (kcal)" type="number" value={cal} onChange={(e) => setCal(e.target.value)} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <Input label="Proteína (g)" type="number" value={p} onChange={(e) => setP(e.target.value)} />
        <Input label="Carbo. (g)"   type="number" value={c} onChange={(e) => setC(e.target.value)} />
        <Input label="Gordura (g)"  type="number" value={f} onChange={(e) => setF(e.target.value)} />
      </div>
    </Dialog>
  );
};

const PlansScreen = ({ plans, setPlans, navigate }) => {
  const [dlg, setDlg] = React.useState(false);
  const toast = useToast();

  const setMain = (id) => {
    setPlans(plans.map((p) => ({ ...p, main: p.id === id })));
    toast.push("Plano principal atualizado");
  };
  const remove = (id) => {
    if (!confirm("Excluir este plano?")) return;
    setPlans(plans.filter((p) => p.id !== id));
    toast.push("Plano excluído");
  };
  const create = (data) => {
    const id = "p" + (Date.now() % 100000);
    setPlans([
      ...plans,
      { ...data, id, main: false, slots: SLOTS, week: {} },
    ]);
    toast.push("Plano criado");
  };

  return (
    <div>
      <div className="page-h">
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Coleção</div>
          <h1 className="h1">Planos alimentares</h1>
          <p className="desc">Crie e gerencie diferentes planos — para cutting, bulking ou manutenção. Marque um como principal para vê-lo na dashboard.</p>
        </div>
        <Button variant="acc" icon="plus" onClick={() => setDlg(true)}>Novo plano</Button>
      </div>

      {plans.length === 0 ? (
        <EmptyState icon="plans" title="Nenhum plano alimentar"
          body="Crie seu primeiro plano para começar a organizar suas refeições."
          action={<Button variant="acc" icon="plus" onClick={() => setDlg(true)}>Criar primeiro plano</Button>} />
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 14,
        }}>
          {plans.map((p) => (
            <PlanCard key={p.id} plan={p}
              onOpen={() => navigate("plan-detail", { id: p.id })}
              onSetMain={() => setMain(p.id)}
              onEdit={() => navigate("plan-detail", { id: p.id })}
              onDelete={() => remove(p.id)} />
          ))}
        </div>
      )}

      <NewPlanDialog open={dlg} onClose={() => setDlg(false)} onCreate={create} />
    </div>
  );
};

Object.assign(window, { PlansScreen });
