// screen-foods.jsx — Foods database with search + table/cards

const FoodFormDialog = ({ open, onClose, initial, onSave }) => {
  const [data, setData] = React.useState({
    name: "", cal: 0, portion: "100g", p: 0, c: 0, f: 0, fib: 0,
  });
  React.useEffect(() => {
    if (open) setData(initial || { name: "", cal: 0, portion: "100g", p: 0, c: 0, f: 0, fib: 0 });
  }, [open, initial]);

  const set = (k, v) => setData({ ...data, [k]: v });
  const submit = () => {
    if (!data.name.trim()) return;
    onSave({ ...data, cal: +data.cal, p: +data.p, c: +data.c, f: +data.f, fib: +data.fib });
    onClose();
  };
  return (
    <Dialog open={open} onClose={onClose}
            title={initial ? "Editar alimento" : "Novo alimento"}
            description="Valores nutricionais por porção informada."
            lg
            footer={<>
              <Button variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button variant="pri" onClick={submit}>{initial ? "Salvar" : "Criar"}</Button>
            </>}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
        <Input label="Nome" value={data.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex: Frango grelhado" />
        <Input label="Porção" value={data.portion} onChange={(e) => set("portion", e.target.value)} />
      </div>
      <Input label="Calorias (kcal)" type="number" value={data.cal} onChange={(e) => set("cal", e.target.value)} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
        <Input label="Proteína (g)" type="number" value={data.p} onChange={(e) => set("p", e.target.value)} />
        <Input label="Carbo. (g)"   type="number" value={data.c} onChange={(e) => set("c", e.target.value)} />
        <Input label="Gordura (g)"  type="number" value={data.f} onChange={(e) => set("f", e.target.value)} />
        <Input label="Fibras (g)"   type="number" value={data.fib} onChange={(e) => set("fib", e.target.value)} />
      </div>
    </Dialog>
  );
};

const FoodsScreen = ({ foods, setFoods }) => {
  const [q, setQ] = React.useState("");
  const [dlg, setDlg] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const toast = useToast();

  const filtered = React.useMemo(
    () => foods.filter((f) => f.name.toLowerCase().includes(q.toLowerCase())),
    [foods, q]
  );

  const remove = (id) => {
    if (!confirm("Excluir este alimento?")) return;
    setFoods(foods.filter((f) => f.id !== id));
    toast.push("Alimento excluído");
  };
  const save = (data) => {
    if (editing) {
      setFoods(foods.map((f) => f.id === editing.id ? { ...editing, ...data } : f));
      toast.push("Alimento atualizado");
    } else {
      setFoods([{ ...data, id: "f" + Date.now() }, ...foods]);
      toast.push("Alimento criado");
    }
    setEditing(null);
  };

  return (
    <div>
      <div className="page-h">
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Base de dados</div>
          <h1 className="h1">Alimentos</h1>
          <p className="desc">Sua biblioteca particular de alimentos com macros por porção. Use-os para montar refeições e planos.</p>
        </div>
        <Button variant="acc" icon="plus" onClick={() => { setEditing(null); setDlg(true); }}>Novo alimento</Button>
      </div>

      <div className="search-wrap" style={{ marginBottom: 18 }}>
        <div className="field-wrap" style={{ flex: 1 }}>
          <span className="icn"><Icon name="search" size={16} /></span>
          <input className="field with-icon" placeholder="Buscar alimentos…"
                 value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="mono" style={{ fontSize: 11.5, color: "var(--muted)", whiteSpace: "nowrap" }}>
          {filtered.length} de {foods.length}
        </div>
      </div>

      {/* Desktop table */}
      <div className="foods-desktop card" style={{ padding: 0, overflow: "hidden" }}>
        <style>{`@media(max-width:780px){.foods-desktop{display:none}.foods-mobile{display:flex !important}}`}</style>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface-alt)" }}>
              {["Nome", "Porção", "kcal", "P", "C", "G", "Fib", ""].map((h, i) => (
                <th key={i} style={{
                  padding: "12px 14px", textAlign: i === 0 ? "left" : i === 7 ? "right" : "right",
                  fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase",
                  letterSpacing: "0.06em", color: "var(--muted)", fontWeight: 500,
                  borderBottom: "1px solid var(--line)",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((f, i) => (
              <tr key={f.id} className="food-row"
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--line)" : "none" }}>
                <td style={{ padding: "12px 14px", fontSize: 13.5, fontWeight: 500 }}>{f.name}</td>
                <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)", textAlign: "right" }}>{f.portion}</td>
                <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--m-cal)", fontWeight: 600, textAlign: "right" }}>{f.cal}</td>
                <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--m-pro)", textAlign: "right" }}>{f.p}</td>
                <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--m-carb)", textAlign: "right" }}>{f.c}</td>
                <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--m-fat)", textAlign: "right" }}>{f.f}</td>
                <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--muted)", textAlign: "right" }}>{f.fib}</td>
                <td style={{ padding: "8px 14px", textAlign: "right" }}>
                  <Button variant="ghost" size="xs" icon="edit" onClick={() => { setEditing(f); setDlg(true); }} />
                  <Button variant="ghost" size="xs" icon="trash" onClick={() => remove(f.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="foods-mobile" style={{ display: "none", flexDirection: "column", gap: 10 }}>
        {filtered.map((f) => (
          <div key={f.id} className="card card-pad-sm">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{f.name}</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{f.portion}</div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <Button variant="ghost" size="xs" icon="edit" onClick={() => { setEditing(f); setDlg(true); }} />
                <Button variant="ghost" size="xs" icon="trash" onClick={() => remove(f.id)} />
              </div>
            </div>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8,
              borderTop: "1px solid var(--line)", paddingTop: 10,
            }}>
              {[
                ["kcal", f.cal, "var(--m-cal)"],
                ["P", f.p, "var(--m-pro)"],
                ["C", f.c, "var(--m-carb)"],
                ["G", f.f, "var(--m-fat)"],
              ].map(([k, v, color]) => (
                <div key={k}>
                  <div className="eyebrow" style={{ marginBottom: 2 }}>{k}</div>
                  <div className="num" style={{ fontSize: 14, color, fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <FoodFormDialog open={dlg} onClose={() => setDlg(false)} initial={editing} onSave={save} />
    </div>
  );
};

Object.assign(window, { FoodsScreen });
