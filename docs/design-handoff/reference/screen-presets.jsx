// screen-presets.jsx — Refeições prontas (preset meals)

const PresetCard = ({ preset, onApply, onEdit, onDelete }) => {
  const [open, setOpen] = React.useState(false);
  const totals = sumMacros(preset.items);
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <button onClick={() => setOpen(!open)} style={{
          appearance: "none", background: "transparent", border: 0, padding: 0,
          color: "var(--muted)", cursor: "pointer", display: "flex",
        }}>
          <Icon name={open ? "chev-d" : "chev-r"} size={18} />
        </button>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{preset.name}</div>
          <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 3, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span>{preset.items.length} alimentos</span>
            <span>·</span>
            <span style={{ color: "var(--m-cal)" }}>{Math.round(totals.cal)} kcal</span>
            <span>P {Math.round(totals.p)}g</span>
            <span>C {Math.round(totals.c)}g</span>
            <span>G {Math.round(totals.f)}g</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <Button variant="ghost" size="sm" icon="copy" onClick={onApply}>Aplicar</Button>
          <Button variant="ghost" size="sm" icon="edit" onClick={onEdit} />
          <Button variant="ghost" size="sm" icon="trash" onClick={onDelete} />
        </div>
      </div>
      {open && (
        <div style={{ borderTop: "1px solid var(--line)", background: "var(--surface-alt)", padding: "10px 20px 16px" }}>
          {preset.items.map((it, i) => {
            const f = foodById(it.foodId);
            const s = scaleFood(it.foodId, it.qty);
            return (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "1fr auto auto", gap: 16,
                alignItems: "center",
                padding: "8px 0",
                borderBottom: i < preset.items.length - 1 ? "1px solid var(--line)" : "none",
              }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{f.name}</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                    P {s.p.toFixed(1)}g · C {s.c.toFixed(1)}g · G {s.f.toFixed(1)}g
                  </div>
                </div>
                <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>{it.qty}g</span>
                <span className="num" style={{ fontSize: 13, color: "var(--ink-2)", width: 60, textAlign: "right" }}>{Math.round(s.cal)} kcal</span>
              </div>
            );
          })}
          <div style={{ paddingTop: 12 }}>
            <Button variant="sec" size="sm" icon="plus">Adicionar alimento</Button>
          </div>
        </div>
      )}
    </div>
  );
};

const NewPresetDialog = ({ open, onClose, onCreate }) => {
  const [name, setName] = React.useState("");
  const submit = () => {
    if (!name.trim()) return;
    onCreate({ id: "pr" + Date.now(), name, items: [] });
    setName("");
    onClose();
  };
  return (
    <Dialog open={open} onClose={onClose}
            title="Nova refeição pronta"
            description="Dê um nome para reaproveitar essa combinação em vários planos e dias."
            footer={<>
              <Button variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button variant="acc" onClick={submit}>Criar</Button>
            </>}>
      <Input label="Nome" placeholder="Ex: Marmita padrão" value={name} onChange={(e) => setName(e.target.value)} />
    </Dialog>
  );
};

const PresetsScreen = ({ presets, setPresets }) => {
  const [dlg, setDlg] = React.useState(false);
  const toast = useToast();

  const remove = (id) => {
    if (!confirm("Excluir esta refeição pronta?")) return;
    setPresets(presets.filter((p) => p.id !== id));
    toast.push("Refeição excluída");
  };

  return (
    <div>
      <div className="page-h">
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Templates</div>
          <h1 className="h1">Refeições prontas</h1>
          <p className="desc">Combinações reutilizáveis de alimentos para aplicar rapidamente em qualquer refeição do seu plano.</p>
        </div>
        <Button variant="acc" icon="plus" onClick={() => setDlg(true)}>Nova refeição pronta</Button>
      </div>

      {presets.length === 0 ? (
        <EmptyState icon="presets" title="Nenhuma refeição pronta"
          body="Salve combinações como omelete fitness, marmita padrão e reaproveite ao longo da semana."
          action={<Button variant="acc" icon="plus" onClick={() => setDlg(true)}>Criar a primeira</Button>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {presets.map((p) => (
            <PresetCard key={p.id} preset={p}
              onApply={() => toast.push("Selecione uma refeição para aplicar")}
              onEdit={() => toast.push("Editor inline disponível ao expandir")}
              onDelete={() => remove(p.id)} />
          ))}
        </div>
      )}

      <NewPresetDialog open={dlg} onClose={() => setDlg(false)}
        onCreate={(p) => { setPresets([p, ...presets]); toast.push("Refeição criada"); }} />
    </div>
  );
};

Object.assign(window, { PresetsScreen });
