// screen-plan-detail.jsx — Plan detail (day view + week view variants)

// ── Add food dialog (food picker + quantity, or preset) ──────────
const AddFoodDialog = ({ open, onClose, onAdd, onApplyPreset }) => {
  const [tab, setTab] = React.useState("food");
  const [q, setQ] = React.useState("");
  const [picked, setPicked] = React.useState(null);
  const [qty, setQty] = React.useState(100);
  const [presetId, setPresetId] = React.useState(null);

  React.useEffect(() => {
    if (!open) { setQ(""); setPicked(null); setQty(100); setPresetId(null); setTab("food"); }
  }, [open]);

  const filtered = FOODS.filter((f) =>
    f.name.toLowerCase().includes(q.toLowerCase())
  );

  const submit = () => {
    if (tab === "food" && picked) {
      onAdd({ foodId: picked.id, qty: Number(qty) });
      onClose();
    } else if (tab === "preset" && presetId) {
      onApplyPreset(presetId);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Adicionar à refeição"
            description="Escolha um alimento individual ou aplique uma refeição pronta."
            lg
            footer={<>
              <Button variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button variant="acc" onClick={submit}
                      disabled={(tab === "food" && !picked) || (tab === "preset" && !presetId)}>
                {tab === "food" ? "Adicionar" : "Aplicar"}
              </Button>
            </>}>
      <Tabs value={tab} onChange={setTab} options={[
        { value: "food", label: "Alimento" },
        { value: "preset", label: "Refeição pronta" },
      ]} />
      {tab === "food" ? (
        <>
          <Input icon="search" placeholder="Buscar alimentos…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div style={{
            maxHeight: 240, overflowY: "auto",
            border: "1px solid var(--line)", borderRadius: "var(--r-md)",
          }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 18, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                Nenhum alimento encontrado.
              </div>
            ) : filtered.slice(0, 20).map((f) => (
              <button key={f.id}
                onClick={() => setPicked(f)}
                style={{
                  appearance: "none", width: "100%", textAlign: "left",
                  background: picked?.id === f.id ? "var(--surface-alt)" : "transparent",
                  border: 0, padding: "10px 14px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  borderBottom: "1px solid var(--line)", cursor: "pointer",
                  font: "inherit", color: "inherit",
                }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{f.name}</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                    {f.portion} · {f.cal} kcal · P {f.p}g · C {f.c}g · G {f.f}g
                  </div>
                </div>
                {picked?.id === f.id && <Icon name="check" size={16} style={{ color: "var(--accent)" }} />}
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "end" }}>
            <Input label="Quantidade (g)" type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
            <div className="mono" style={{ fontSize: 11, color: "var(--muted)", paddingBottom: 12 }}>
              {picked ? `≈ ${Math.round(picked.cal * qty / 100)} kcal` : "Selecione um alimento"}
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 12.5, color: "var(--warn)", background: "color-mix(in oklab, var(--warn) 10%, transparent)",
                        padding: "10px 12px", borderRadius: 8 }}>
            <Icon name="alert" size={14} style={{ verticalAlign: "-3px", marginRight: 6 }} />
            Os alimentos atuais desta refeição serão substituídos.
          </div>
          <div style={{
            maxHeight: 280, overflowY: "auto",
            border: "1px solid var(--line)", borderRadius: "var(--r-md)",
          }}>
            {PRESETS.map((pr) => {
              const t = sumMacros(pr.items);
              return (
                <button key={pr.id} onClick={() => setPresetId(pr.id)}
                  style={{
                    appearance: "none", width: "100%", textAlign: "left",
                    background: presetId === pr.id ? "var(--surface-alt)" : "transparent",
                    border: 0, padding: "12px 14px",
                    borderBottom: "1px solid var(--line)", cursor: "pointer",
                    font: "inherit", color: "inherit",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                  }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{pr.name}</div>
                    <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                      {pr.items.length} alimentos · {Math.round(t.cal)} kcal
                    </div>
                  </div>
                  {presetId === pr.id && <Icon name="check" size={16} style={{ color: "var(--accent)" }} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </Dialog>
  );
};

// ── Slots manager dialog ─────────────────────────────────────────
const SlotsManagerDialog = ({ open, onClose, slots, onChange }) => {
  const [list, setList] = React.useState(slots);
  const [nm, setNm] = React.useState("");
  const [tm, setTm] = React.useState("08:00");
  React.useEffect(() => { if (open) setList(slots); }, [open, slots]);

  const add = () => {
    if (!nm.trim()) return;
    setList([...list, { id: "s" + Date.now(), name: nm, time: tm }]);
    setNm(""); setTm("08:00");
  };
  const update = (idx, key, val) => {
    setList(list.map((s, i) => i === idx ? { ...s, [key]: val } : s));
  };
  const move = (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= list.length) return;
    const arr = [...list];
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    setList(arr);
  };
  const remove = (idx) => setList(list.filter((_, i) => i !== idx));
  const save = () => { onChange(list); onClose(); };

  return (
    <Dialog open={open} onClose={onClose} title="Editar refeições"
            description="Renomeie, reordene e ajuste horários das refeições do dia."
            lg
            footer={<>
              <Button variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button variant="pri" onClick={save}>Salvar alterações</Button>
            </>}>
      <div>
        <label className="label">Adicionar refeição</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 110px auto", gap: 8 }}>
          <input className="field" placeholder="Nome (ex: Ceia)" value={nm} onChange={(e) => setNm(e.target.value)} />
          <input className="field" type="time" value={tm} onChange={(e) => setTm(e.target.value)} />
          <Button variant="pri" icon="plus" onClick={add}>Adicionar</Button>
        </div>
      </div>
      <div style={{ border: "1px solid var(--line)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
        {list.map((s, i) => (
          <div key={s.id} style={{
            display: "grid", gridTemplateColumns: "auto 1fr 120px auto auto auto",
            gap: 8, alignItems: "center", padding: "10px 12px",
            borderBottom: i < list.length - 1 ? "1px solid var(--line)" : "none",
          }}>
            <Icon name="drag" size={16} style={{ color: "var(--muted-2)", cursor: "grab" }} />
            <input className="field" value={s.name} onChange={(e) => update(i, "name", e.target.value)} />
            <input className="field" type="time" value={s.time} onChange={(e) => update(i, "time", e.target.value)} />
            <Button variant="ghost" size="xs" icon="chev-u" onClick={() => move(i, -1)} />
            <Button variant="ghost" size="xs" icon="chev-d" onClick={() => move(i, +1)} />
            <Button variant="ghost" size="xs" icon="trash" onClick={() => remove(i)} />
          </div>
        ))}
      </div>
    </Dialog>
  );
};

// ── Editable food row (day view) ────────────────────────────────
const EditableFoodRow = ({ item, onChange, onDelete }) => {
  const f = foodById(item.foodId);
  const m = scaleFood(item.foodId, item.qty);
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 90px auto auto",
      gap: 12, alignItems: "center",
      padding: "10px 0",
      borderBottom: "1px solid var(--line)",
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{f.name}</div>
        <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
          {Math.round(m.cal)} kcal · P {m.p.toFixed(1)}g · C {m.c.toFixed(1)}g · G {m.f.toFixed(1)}g
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--line)", borderRadius: 8, background: "var(--surface)", overflow: "hidden" }}>
        <input type="number"
          value={item.qty}
          onChange={(e) => onChange({ ...item, qty: Math.max(0, Number(e.target.value)) })}
          style={{
            width: "100%", height: 32, border: 0, padding: "0 0 0 10px",
            background: "transparent", outline: "none", fontSize: 13,
            fontFamily: "var(--font-mono)", textAlign: "right",
          }} />
        <span className="mono" style={{ fontSize: 11, color: "var(--muted)", padding: "0 8px" }}>g</span>
      </div>
      <span className="num" style={{ fontSize: 13, color: "var(--ink-2)", width: 64, textAlign: "right" }}>
        {Math.round(m.cal)}<span style={{ color: "var(--muted)", fontSize: 11 }}> kcal</span>
      </span>
      <Button variant="ghost" size="xs" icon="x" onClick={onDelete} />
    </div>
  );
};

// ── Day-view meal card with editing ──────────────────────────────
const EditMealCard = ({ slot, meal, onChange, onAdd, onToggleCheat, onCopy }) => {
  const totals = sumMacros(meal.items);
  const [moreOpen, setMoreOpen] = React.useState(false);
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, borderBottom: meal.cheat || meal.items.length ? "1px solid var(--line)" : "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{slot.name}</span>
          <span className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>{slot.time}</span>
          {meal.cheat && <span className="badge badge-cheat">Refeição livre</span>}
        </div>
        <div style={{ display: "flex", gap: 6, position: "relative" }}>
          {!meal.cheat && <MacroLine totals={totals} compact />}
          <Button variant="ghost" size="xs" icon="more" onClick={() => setMoreOpen((o) => !o)} />
          {moreOpen && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 9 }} onClick={() => setMoreOpen(false)} />
              <div className="card" style={{
                position: "absolute", top: 30, right: 0, zIndex: 10,
                minWidth: 200, padding: 6, boxShadow: "var(--shadow-3)",
              }}>
                <button className="sb-item" style={{ padding: "8px 10px", fontSize: 13 }}
                        onClick={() => { onToggleCheat(); setMoreOpen(false); }}>
                  <Icon name={meal.cheat ? "x" : "flame"} size={15} />
                  {meal.cheat ? "Desmarcar como livre" : "Marcar como livre"}
                </button>
                <button className="sb-item" style={{ padding: "8px 10px", fontSize: 13 }}
                        onClick={() => { onCopy(); setMoreOpen(false); }}>
                  <Icon name="copy" size={15} /> Copiar para outros dias
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {meal.cheat ? (
        <div style={{ padding: "16px 18px", color: "var(--muted)", fontSize: 13 }}>
          Esta refeição não conta nos macros do dia.{" "}
          <button className="btn btn-ghost btn-xs" onClick={onToggleCheat} style={{ padding: "2px 6px" }}>
            Desmarcar
          </button>
        </div>
      ) : (
        <>
          <div style={{ padding: "4px 18px" }}>
            {meal.items.length === 0 ? (
              <div style={{ padding: "14px 0", color: "var(--muted)", fontSize: 13 }}>
                Nenhum alimento adicionado.
              </div>
            ) : meal.items.map((it, i) => (
              <EditableFoodRow key={i} item={it}
                onChange={(nx) => onChange(meal.items.map((x, j) => j === i ? nx : x))}
                onDelete={() => onChange(meal.items.filter((_, j) => j !== i))} />
            ))}
          </div>
          <div style={{ padding: "12px 18px 14px" }}>
            <Button variant="sec" size="sm" icon="plus" onClick={onAdd}>
              Adicionar alimento
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

// ── Copy-meal popover ────────────────────────────────────────────
const CopyMealDialog = ({ open, onClose, fromDay, onCopy }) => {
  const [days, setDays] = React.useState(new Set());
  React.useEffect(() => { if (!open) setDays(new Set()); }, [open]);
  const toggle = (i) => {
    const n = new Set(days);
    n.has(i) ? n.delete(i) : n.add(i);
    setDays(n);
  };
  return (
    <Dialog open={open} onClose={onClose} title="Copiar refeição"
            description={`Selecione os dias que receberão uma cópia desta refeição (de ${DAYS[fromDay]}).`}
            footer={<>
              <Button variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button variant="pri" disabled={days.size === 0} onClick={() => { onCopy([...days]); onClose(); }}>
                Copiar ({days.size})
              </Button>
            </>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {DAYS.map((d, i) => i !== fromDay && (
          <button key={d}
                  onClick={() => toggle(i)}
                  style={{
                    appearance: "none", textAlign: "left",
                    padding: "10px 12px", borderRadius: 8,
                    border: "1px solid var(--line)",
                    background: days.has(i) ? "var(--ink)" : "var(--surface)",
                    color: days.has(i) ? "var(--bg)" : "var(--ink)",
                    cursor: "pointer", font: "inherit",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
            <span style={{ fontWeight: 500, fontSize: 13.5 }}>{d}</span>
            {days.has(i) && <Icon name="check" size={14} />}
          </button>
        ))}
      </div>
    </Dialog>
  );
};

// ── Week view ────────────────────────────────────────────────────
// Three variants: table, board, compact. User selects via tabs.
const WeekTable = ({ plan, onCell }) => {
  return (
    <div className="card" style={{ padding: 0, overflow: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 1000 }}>
        <thead>
          <tr style={{ background: "var(--surface-alt)" }}>
            <th style={thS}></th>
            {DAYS.map((d, i) => {
              const items = plan.slots.flatMap((sl) => (plan.week[i]?.[sl.id]?.cheat ? [] : plan.week[i]?.[sl.id]?.items || []));
              const tot = sumMacros(items);
              return (
                <th key={d} style={{ ...thS, textAlign: "left" }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>{DAYS_SHORT[i]}</div>
                  <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 4, fontWeight: 400 }}>
                    {Math.round(tot.cal)} kcal
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {plan.slots.map((sl) => (
            <tr key={sl.id}>
              <td style={{ ...tdS, background: "var(--surface-alt)", verticalAlign: "top", width: 140 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{sl.name}</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{sl.time}</div>
              </td>
              {DAYS.map((d, di) => {
                const m = plan.week[di]?.[sl.id] || { cheat: false, items: [] };
                const t = sumMacros(m.items);
                return (
                  <td key={d} style={{ ...tdS, verticalAlign: "top", width: 130 }}>
                    {m.cheat ? (
                      <span className="badge badge-cheat" style={{ fontSize: 10 }}>Livre</span>
                    ) : m.items.length === 0 ? (
                      <button className="btn btn-ghost btn-xs" style={{ width: "100%", borderStyle: "dashed", borderColor: "var(--line-2)" }}
                              onClick={() => onCell(di, sl.id, "add")}>
                        <Icon name="plus" size={12} /> Add
                      </button>
                    ) : (
                      <div>
                        <div className="num" style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 500, marginBottom: 6 }}>
                          {Math.round(t.cal)}<span style={{ color: "var(--muted)" }}> kcal</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {m.items.slice(0, 3).map((it, i) => (
                            <div key={i} style={{
                              fontSize: 11, color: "var(--muted)",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>· {foodById(it.foodId).name}</div>
                          ))}
                          {m.items.length > 3 && <div style={{ fontSize: 11, color: "var(--muted-2)" }}>+{m.items.length - 3}</div>}
                        </div>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
const thS = { padding: "12px 14px", textAlign: "left", borderBottom: "1px solid var(--line)", fontWeight: 500, color: "var(--muted)", fontSize: 12, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em" };
const tdS = { padding: "12px 14px", borderBottom: "1px solid var(--line)", borderRight: "1px solid var(--line)" };

const WeekBoard = ({ plan }) => {
  return (
    <div style={{
      display: "grid", gridAutoFlow: "column",
      gridAutoColumns: "minmax(220px, 1fr)",
      gap: 12, overflowX: "auto", paddingBottom: 8,
    }}>
      {DAYS.map((d, di) => {
        const items = plan.slots.flatMap((sl) => (plan.week[di]?.[sl.id]?.cheat ? [] : plan.week[di]?.[sl.id]?.items || []));
        const tot = sumMacros(items);
        return (
          <div key={d} className="card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{DAYS_SHORT[di]}</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                  {Math.round(tot.cal)} kcal · P {Math.round(tot.p)} · C {Math.round(tot.c)} · G {Math.round(tot.f)}
                </div>
              </div>
              <span className="mono" style={{ fontSize: 10, color: "var(--muted-2)" }}>{String(di + 1).padStart(2, "0")}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {plan.slots.map((sl) => {
                const m = plan.week[di]?.[sl.id] || { cheat: false, items: [] };
                const t = sumMacros(m.items);
                return (
                  <div key={sl.id} style={{
                    padding: 8, borderRadius: 8,
                    background: m.cheat ? "var(--accent-soft)" : "var(--surface-alt)",
                    border: "1px solid var(--line)",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{sl.name}</span>
                      {m.cheat ? (
                        <span className="mono" style={{ fontSize: 10, color: "var(--accent)" }}>LIVRE</span>
                      ) : (
                        <span className="num" style={{ fontSize: 11, color: "var(--ink-2)" }}>{Math.round(t.cal)}</span>
                      )}
                    </div>
                    {!m.cheat && (
                      <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.4 }}>
                        {m.items.length === 0 ? "—" : m.items.map((it) => foodById(it.foodId).name).join(", ")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const WeekCompact = ({ plan }) => {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        display: "grid", gridTemplateColumns: `160px repeat(7, 1fr)`,
        background: "var(--surface-alt)",
        borderBottom: "1px solid var(--line)",
      }}>
        <div style={{ padding: "12px 14px" }}></div>
        {DAYS.map((d, i) => {
          const items = plan.slots.flatMap((sl) => (plan.week[i]?.[sl.id]?.cheat ? [] : plan.week[i]?.[sl.id]?.items || []));
          const tot = sumMacros(items);
          return (
            <div key={d} style={{ padding: "10px 12px", borderLeft: "1px solid var(--line)" }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{DAYS_LETTER[i]}</div>
              <div className="mono" style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
                {Math.round(tot.cal)}
              </div>
            </div>
          );
        })}
      </div>
      {/* Rows: meal slots */}
      {plan.slots.map((sl) => (
        <div key={sl.id} style={{
          display: "grid", gridTemplateColumns: `160px repeat(7, 1fr)`,
          borderBottom: "1px solid var(--line)",
        }}>
          <div style={{ padding: "12px 14px", borderRight: "1px solid var(--line)" }}>
            <div style={{ fontSize: 12.5, fontWeight: 500 }}>{sl.name}</div>
            <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>{sl.time}</div>
          </div>
          {DAYS.map((d, di) => {
            const m = plan.week[di]?.[sl.id] || { cheat: false, items: [] };
            const t = sumMacros(m.items);
            return (
              <div key={d} style={{ padding: "10px 12px", borderLeft: di === 0 ? "0" : "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 4, minHeight: 56 }}>
                {m.cheat ? (
                  <div style={{ fontSize: 11, color: "var(--accent)", fontFamily: "var(--font-mono)", fontWeight: 500 }}>LIVRE</div>
                ) : m.items.length === 0 ? (
                  <div style={{ fontSize: 11, color: "var(--muted-2)", fontFamily: "var(--font-mono)" }}>—</div>
                ) : (
                  <>
                    <div className="num" style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 500 }}>{Math.round(t.cal)}</div>
                    <div style={{ display: "flex", gap: 3 }}>
                      {[["p", t.p, plan.target.p], ["c", t.c, plan.target.c], ["f", t.f, plan.target.f]].map(([k, v, tg]) => (
                        <div key={k} style={{ flex: 1, height: 3, background: "var(--surface-alt)", borderRadius: 999, overflow: "hidden" }}>
                          <div style={{ width: Math.min(100, (v / tg) * 100) + "%", height: "100%", background: `var(--m-${k === "p" ? "pro" : k === "c" ? "carb" : "fat"})` }} />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// ── Plan detail screen ───────────────────────────────────────────
const PlanDetailScreen = ({ planId, plans, setPlans, navigate }) => {
  const planIdx = plans.findIndex((p) => p.id === planId);
  const plan = plans[planIdx];
  if (!plan) {
    return (
      <div>
        <Button variant="ghost" icon="arrow-l" onClick={() => navigate("plans")}>Voltar</Button>
        <EmptyState icon="plans" title="Plano não encontrado" body="Esse plano não existe mais." action={
          <Button variant="pri" onClick={() => navigate("plans")}>Ir para planos</Button>
        } />
      </div>
    );
  }

  const [view, setView] = React.useState("week");
  const [day, setDay] = React.useState(0);
  const [weekVariant, setWeekVariant] = React.useState("table");
  const [slotsDlg, setSlotsDlg] = React.useState(false);
  const [addDlg, setAddDlg] = React.useState(null); // { day, slotId }
  const [copyDlg, setCopyDlg] = React.useState(null); // { day, slotId }

  const toast = useToast();

  const update = (mut) => {
    const next = [...plans];
    next[planIdx] = mut(plan);
    setPlans(next);
  };

  // Mutators
  const setMealItems = (d, sid, items) => update((p) => ({
    ...p,
    week: { ...p.week, [d]: { ...p.week[d], [sid]: { ...(p.week[d]?.[sid] || {}), items, cheat: p.week[d]?.[sid]?.cheat || false } } },
  }));
  const toggleCheat = (d, sid) => update((p) => ({
    ...p,
    week: { ...p.week, [d]: { ...p.week[d], [sid]: { ...(p.week[d]?.[sid] || { items: [] }), cheat: !(p.week[d]?.[sid]?.cheat) } } },
  }));
  const setSlots = (slots) => { update((p) => ({ ...p, slots })); toast.push("Refeições atualizadas"); };

  // Day totals
  const dayMeals = plan.week?.[day] || {};
  const dayItems = plan.slots.flatMap((sl) => dayMeals[sl.id]?.cheat ? [] : dayMeals[sl.id]?.items || []);
  const totals = sumMacros(dayItems);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 26 }}>
        <button onClick={() => navigate("plans")} style={{
          appearance: "none", background: "transparent", border: 0,
          color: "var(--muted)", fontSize: 12, fontFamily: "var(--font-mono)",
          textTransform: "uppercase", letterSpacing: "0.06em", cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 6, padding: 0, marginBottom: 10,
        }}>
          <Icon name="arrow-l" size={13} /> Planos
        </button>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <h1 className="h1" style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
              {plan.name}
              {plan.main && <Icon name="star-f" size={20} style={{ color: "var(--accent)" }} />}
            </h1>
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span className="badge" style={{
                background: GOAL_STYLE[plan.goal]?.bg, color: GOAL_STYLE[plan.goal]?.fg, border: "0",
              }}>{plan.goal}</span>
              <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
                Meta · {plan.target.cal} kcal · P {plan.target.p} · C {plan.target.c} · G {plan.target.f}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Tabs value={view} onChange={setView} options={[
              { value: "week", label: "Semana", icon: "calendar" },
              { value: "day", label: "Dia", icon: "clock" },
            ]} />
            <Button variant="sec" icon="edit" onClick={() => setSlotsDlg(true)}>Editar refeições</Button>
          </div>
        </div>
      </div>

      {view === "day" ? (
        <>
          <DayTabs value={day} onChange={setDay} />
          {/* Today macros */}
          <div className="card card-pad-sm" style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Totais de {DAYS[day]}</div>
                <MacroLine totals={totals} />
              </div>
              <div style={{ display: "flex", gap: 24 }}>
                {[
                  ["kcal", totals.cal, plan.target.cal, "var(--m-cal)"],
                  ["P",    totals.p,   plan.target.p,   "var(--m-pro)"],
                  ["C",    totals.c,   plan.target.c,   "var(--m-carb)"],
                  ["G",    totals.f,   plan.target.f,   "var(--m-fat)"],
                ].map(([lbl, v, t, color]) => {
                  const pct = Math.min(100, (v / t) * 100);
                  return (
                    <div key={lbl} style={{ textAlign: "right" }}>
                      <div className="eyebrow" style={{ marginBottom: 2 }}>{lbl}</div>
                      <div className="num" style={{ fontSize: 17, fontWeight: 600 }}>{Math.round(v)}</div>
                      <div style={{ width: 60, height: 3, background: "var(--surface-alt)", marginTop: 4, borderRadius: 999 }}>
                        <div style={{ width: pct + "%", height: "100%", background: color, borderRadius: 999 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {plan.slots.map((sl) => {
              const meal = plan.week?.[day]?.[sl.id] || { cheat: false, items: [] };
              return (
                <EditMealCard key={sl.id} slot={sl} meal={meal}
                  onChange={(items) => setMealItems(day, sl.id, items)}
                  onAdd={() => setAddDlg({ day, slotId: sl.id })}
                  onToggleCheat={() => toggleCheat(day, sl.id)}
                  onCopy={() => setCopyDlg({ day, slotId: sl.id })} />
              );
            })}
          </div>
        </>
      ) : (
        <>
          <Tabs value={weekVariant} onChange={setWeekVariant}
            options={[
              { value: "table",   label: "Tabela", icon: "list" },
              { value: "board",   label: "Quadro", icon: "grid" },
              { value: "compact", label: "Compacto", icon: "settings" },
            ]} />
          <div style={{ marginTop: 18 }}>
            {weekVariant === "table"   && <WeekTable plan={plan} onCell={() => {}} />}
            {weekVariant === "board"   && <WeekBoard plan={plan} />}
            {weekVariant === "compact" && <WeekCompact plan={plan} />}
          </div>
        </>
      )}

      <SlotsManagerDialog open={slotsDlg} onClose={() => setSlotsDlg(false)}
        slots={plan.slots} onChange={setSlots} />
      <AddFoodDialog open={!!addDlg} onClose={() => setAddDlg(null)}
        onAdd={(item) => {
          const cur = plan.week?.[addDlg.day]?.[addDlg.slotId]?.items || [];
          setMealItems(addDlg.day, addDlg.slotId, [...cur, item]);
          toast.push("Alimento adicionado");
        }}
        onApplyPreset={(prid) => {
          const pr = PRESETS.find((p) => p.id === prid);
          setMealItems(addDlg.day, addDlg.slotId, pr.items);
          toast.push("Refeição pronta aplicada");
        }} />
      <CopyMealDialog open={!!copyDlg} onClose={() => setCopyDlg(null)}
        fromDay={copyDlg?.day || 0}
        onCopy={(days) => {
          const src = plan.week?.[copyDlg.day]?.[copyDlg.slotId];
          if (!src) return;
          update((p) => {
            const nx = { ...p.week };
            days.forEach((d) => {
              nx[d] = { ...nx[d], [copyDlg.slotId]: { cheat: src.cheat, items: [...src.items] } };
            });
            return { ...p, week: nx };
          });
          toast.push(`Copiado para ${days.length} dia${days.length === 1 ? "" : "s"}`);
        }} />
    </div>
  );
};

Object.assign(window, { PlanDetailScreen });
