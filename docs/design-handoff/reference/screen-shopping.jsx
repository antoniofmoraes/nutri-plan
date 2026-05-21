// screen-shopping.jsx — shopping lists + detail

const ShoppingListsScreen = ({ lists, setLists, navigate }) => {
  const [creating, setCreating] = React.useState(false);
  const [name, setName] = React.useState("");
  const toast = useToast();

  const create = () => {
    if (!name.trim()) return;
    const id = "sl" + Date.now();
    setLists([
      { id, name, ownerSelf: true, selectedMeals: 0,
        members: [{ name: USER.name, email: USER.email, role: "Proprietário", initials: USER.initials }],
        items: [] },
      ...lists,
    ]);
    setName(""); setCreating(false);
    toast.push("Lista criada");
    navigate("shopping-detail", { id });
  };
  const remove = (id) => {
    if (!confirm("Excluir esta lista?")) return;
    setLists(lists.filter((l) => l.id !== id));
    toast.push("Lista excluída");
  };

  return (
    <div>
      <div className="page-h">
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Compras</div>
          <h1 className="h1">Listas de compras</h1>
          <p className="desc">Crie listas a partir dos seus planos e convide outras pessoas para compartilharem.</p>
        </div>
        <Button variant="acc" icon="plus" onClick={() => setCreating(true)}>Nova lista</Button>
      </div>

      {lists.length === 0 ? (
        <EmptyState icon="shopping" title="Nenhuma lista de compras"
          body="Selecione refeições do seu plano e gere uma lista organizada com tudo o que precisa."
          action={<Button variant="acc" icon="plus" onClick={() => setCreating(true)}>Criar primeira lista</Button>} />
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 14,
        }}>
          {lists.map((l) => (
            <div key={l.id} className="card" style={{ padding: 0, overflow: "hidden", cursor: "pointer" }}
                 onClick={() => navigate("shopping-detail", { id: l.id })}>
              <div style={{ padding: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <span className={cls("badge", l.ownerSelf && "badge-accent")}>
                    {l.ownerSelf ? "Proprietário" : `Convidado · ${l.invitedBy}`}
                  </span>
                  {l.ownerSelf && (
                    <button className="btn btn-ghost btn-xs btn-icon"
                            onClick={(e) => { e.stopPropagation(); remove(l.id); }}>
                      <Icon name="trash" size={14} />
                    </button>
                  )}
                </div>
                <h3 className="h2" style={{ fontSize: 18, marginBottom: 6 }}>{l.name}</h3>
                <div className="mono" style={{ fontSize: 11.5, color: "var(--muted)" }}>
                  {l.selectedMeals} refeições · {l.members.length} {l.members.length === 1 ? "membro" : "membros"}
                </div>
              </div>
              <div style={{ borderTop: "1px solid var(--line)", background: "var(--surface-alt)",
                            padding: "10px 14px", display: "flex", gap: -2 }}>
                {l.members.slice(0, 4).map((m, i) => (
                  <div key={i} className="av" style={{
                    marginLeft: i === 0 ? 0 : -6, width: 24, height: 24, fontSize: 9.5,
                    border: "2px solid var(--surface-alt)",
                  }}>{m.initials}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={creating} onClose={() => setCreating(false)}
              title="Nova lista de compras"
              footer={<>
                <Button variant="ghost" onClick={() => setCreating(false)}>Cancelar</Button>
                <Button variant="acc" onClick={create}>Criar lista</Button>
              </>}>
        <Input label="Nome" placeholder="Ex: Compras da semana"
               value={name} onChange={(e) => setName(e.target.value)} />
      </Dialog>
    </div>
  );
};

// ── Shopping list detail ─────────────────────────────────────────
const ShoppingDetailScreen = ({ listId, lists, setLists, plans, navigate }) => {
  const list = lists.find((l) => l.id === listId);
  const [mealDlg, setMealDlg] = React.useState(false);
  const [inviteDlg, setInviteDlg] = React.useState(false);
  const toast = useToast();

  if (!list) {
    return (
      <div>
        <Button variant="ghost" icon="arrow-l" onClick={() => navigate("shopping")}>Voltar</Button>
        <EmptyState icon="shopping" title="Lista não encontrada" body="Talvez tenha sido excluída." />
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => navigate("shopping")} style={{
        appearance: "none", background: "transparent", border: 0,
        color: "var(--muted)", fontSize: 12, fontFamily: "var(--font-mono)",
        textTransform: "uppercase", letterSpacing: "0.06em", cursor: "pointer",
        display: "inline-flex", alignItems: "center", gap: 6, padding: 0, marginBottom: 10,
      }}>
        <Icon name="arrow-l" size={13} /> Listas de compras
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14, marginBottom: 24 }}>
        <div>
          <h1 className="h1">{list.name}</h1>
          <div style={{ marginTop: 8, display: "flex", gap: 10, alignItems: "center" }}>
            <span className={cls("badge", list.ownerSelf && "badge-accent")}>
              {list.ownerSelf ? "Proprietário" : `Convidado · ${list.invitedBy}`}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button variant="sec" icon="check" onClick={() => setMealDlg(true)}>
            Selecionar refeições
            <span className="badge" style={{ background: "var(--ink)", color: "var(--bg)", border: 0, padding: "1px 6px", fontSize: 10 }}>
              {list.selectedMeals}
            </span>
          </Button>
          {list.ownerSelf ? (
            <Button variant="pri" icon="link" onClick={() => setInviteDlg(true)}>Convidar</Button>
          ) : (
            <Button variant="danger" icon="logout">Sair da lista</Button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18 }} className="sl-grid">
        <style>{`@media(max-width:780px){.sl-grid{grid-template-columns:1fr !important}}`}</style>

        {/* Items */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>Itens consolidados</div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{list.items.length} itens</div>
            </div>
            <Button variant="ghost" size="sm" icon="copy">Copiar</Button>
          </div>
          {list.items.length === 0 ? (
            <div style={{ padding: 36, textAlign: "center", color: "var(--muted)" }}>
              <div style={{ marginBottom: 10 }}>Selecione refeições para gerar a lista.</div>
              <Button variant="pri" icon="plus" size="sm" onClick={() => setMealDlg(true)}>
                Selecionar refeições
              </Button>
            </div>
          ) : (
            <div>
              {list.items.map((it, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 14, alignItems: "center",
                  padding: "12px 22px",
                  borderBottom: i < list.items.length - 1 ? "1px solid var(--line)" : "none",
                }}>
                  <input type="checkbox" defaultChecked={i % 3 !== 0}
                         style={{ accentColor: "var(--accent)" }} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{it.name}</span>
                  <span className="num" style={{ fontSize: 13, color: "var(--ink-2)" }}>
                    {it.qty}<span style={{ color: "var(--muted)", fontSize: 11, marginLeft: 3 }}>{it.unit}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Members */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)" }}>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Membros</div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{list.members.length} pessoas</div>
          </div>
          <div>
            {list.members.map((m, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px 18px",
                borderBottom: i < list.members.length - 1 ? "1px solid var(--line)" : "none",
              }}>
                <div className="av av-lg">{m.initials}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{m.name}</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{m.email}</div>
                </div>
                <span className="mono" style={{ fontSize: 10.5, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Meal selection dialog */}
      <Dialog open={mealDlg} onClose={() => setMealDlg(false)}
              title="Selecionar refeições"
              description="Marque as refeições que devem entrar nesta lista de compras."
              lg
              footer={<>
                <Button variant="ghost" onClick={() => setMealDlg(false)}>Cancelar</Button>
                <Button variant="pri" onClick={() => { toast.push("Seleção salva"); setMealDlg(false); }}>Salvar seleção</Button>
              </>}>
        <MealSelectorTree plans={plans} />
      </Dialog>

      {/* Invite dialog */}
      <Dialog open={inviteDlg} onClose={() => setInviteDlg(false)}
              title="Convidar para esta lista"
              description="Compartilhe o link abaixo. Expira em 7 dias.">
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 10px 8px 14px", border: "1px solid var(--line)", borderRadius: "var(--r-md)",
          background: "var(--surface-alt)",
        }}>
          <span className="mono" style={{ flex: 1, fontSize: 12, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            portio.app/c/{list.id}-x9k2
          </span>
          <Button variant="pri" size="sm" icon="copy" onClick={() => toast.push("Link copiado")}>
            Copiar
          </Button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, color: "var(--muted)" }}>
          <span>Expira em <span className="mono">7 dias</span></span>
          <Button variant="danger" size="xs" icon="x">Revogar convite</Button>
        </div>
      </Dialog>
    </div>
  );
};

const MealSelectorTree = ({ plans }) => {
  const [expanded, setExpanded] = React.useState(new Set([plans[0]?.id + ":0"]));
  const [selected, setSelected] = React.useState(new Set(["p1:0:s1", "p1:0:s3", "p1:1:s3"]));
  const toggle = (k) => {
    const s = new Set(expanded);
    s.has(k) ? s.delete(k) : s.add(k);
    setExpanded(s);
  };
  const toggleSel = (k) => {
    const s = new Set(selected);
    s.has(k) ? s.delete(k) : s.add(k);
    setSelected(s);
  };
  return (
    <div style={{
      maxHeight: 360, overflowY: "auto",
      border: "1px solid var(--line)", borderRadius: "var(--r-md)",
    }}>
      {plans.map((p) => (
        <div key={p.id}>
          <button onClick={() => toggle(p.id)} style={treeRow}>
            <Icon name={expanded.has(p.id) ? "chev-d" : "chev-r"} size={14} style={{ color: "var(--muted)" }} />
            <span style={{ fontWeight: 600, flex: 1, textAlign: "left", fontSize: 13.5 }}>{p.name}</span>
            <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{p.target.cal} kcal</span>
          </button>
          {expanded.has(p.id) && DAYS.map((d, di) => {
            const key = p.id + ":" + di;
            return (
              <div key={d}>
                <button onClick={() => toggle(key)} style={{ ...treeRow, paddingLeft: 32, background: "var(--surface-alt)" }}>
                  <Icon name={expanded.has(key) ? "chev-d" : "chev-r"} size={14} style={{ color: "var(--muted)" }} />
                  <span style={{ flex: 1, textAlign: "left", fontSize: 13 }}>{d}</span>
                </button>
                {expanded.has(key) && p.slots.map((sl) => {
                  const sk = p.id + ":" + di + ":" + sl.id;
                  const on = selected.has(sk);
                  const meal = p.week?.[di]?.[sl.id];
                  return (
                    <button key={sk} onClick={() => toggleSel(sk)}
                            style={{ ...treeRow, paddingLeft: 56 }}>
                      <span style={{
                        width: 16, height: 16, borderRadius: 4,
                        background: on ? "var(--accent)" : "var(--surface)",
                        border: "1px solid " + (on ? "var(--accent)" : "var(--line-2)"),
                        display: "grid", placeItems: "center",
                      }}>
                        {on && <Icon name="check" size={11} style={{ color: "var(--accent-ink)" }} />}
                      </span>
                      <span style={{ flex: 1, textAlign: "left", fontSize: 13 }}>{sl.name}</span>
                      <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                        {meal?.items?.length || 0} alim.
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const treeRow = {
  appearance: "none", background: "transparent",
  border: 0, borderBottom: "1px solid var(--line)",
  width: "100%", padding: "10px 14px",
  display: "flex", alignItems: "center", gap: 10,
  cursor: "pointer", font: "inherit", color: "inherit",
};

Object.assign(window, { ShoppingListsScreen, ShoppingDetailScreen });
