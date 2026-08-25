# Telas — PORTIO

> Referência visual: `docs/design-handoff/reference/index.html`
> JSX de referência: `docs/design-handoff/reference/screen-*.jsx`

---

## Layout shell

- Sidebar fixa: `w-64`, full-height, `border-r border-line bg-paper`
- Main: `flex-1 max-w-[1152px] mx-auto px-10 py-8 pb-20`
- Mobile/tablet (`<1024px`): sidebar vira drawer; a partir de `lg` ela fica fixa. Top bar `h-14` com hamburger + wordmark
- Gap entre seções: `gap-7` (28px)

### Sidebar

```
Logo: "PORTIO." (bold, tracking-tight, ponto em accent) + versão mono
Separador: micro-label mono "PLANEJAMENTO"
Nav items: px-3 py-2.5 rounded gap-[11px], ícone 18px
  Ativo: bg-ink text-bg (NUNCA accent)
  Hover: bg-surface-alt
User row: avatar 36px rounded + nome + email mono + logout
```

---

## `/login` e `/register`

- Desktop: split 1:1. Login = form esquerda + painel escuro direita. Register = espelhado.
- Painel escuro: `bg-ink text-bg`, marca PORTIO topo, headline 44px com frase serif itálica, número decorativo 2200 (4% alpha)
- Mobile: só o form, sem painel
- Form max-width `380px`, centrado vertical
- CTA "Entrar"/"Criar conta" variante `acc`, `h-11` (44px)
- Loading: `<spinner /> Entrando…` / `Criando…`

---

## `/` — Dashboard

### Header
- Eyebrow mono: `{dia_semana} · {data}`
- h1: "Olá, {nome}." + sub `text-lg font-medium text-muted` "Aqui está sua semana."
- Direita: dropdown de plano ativo

### Day tabs
Grid 7 colunas. Ver `components.md > Day tabs`.

### Macros
Card sem padding. Header com `border-b`: eyebrow "Macros · {dia}" + tabs viz (`Anel | Barras | Números`).
- **Default: Anel** — 2 colunas (ring 240px + 2×2 macro cards)
- Abaixo de 780px: coluna única

### Refeições
h2 "Refeições de {dia}" + contagem mono + tabs card variant (`Lista | Timeline | Compacto`).
- **Default: Lista** — cards empilhados, header (nome + hora + badge cheat + macros), body = food chips
- Refeição livre: badge `bg-accent text-accent-ink`, sem chips, texto "Refeição livre · macros não contabilizados."

---

## `/planos` — Lista de planos

- Header: eyebrow "Coleção" + h1 + descrição `text-muted` max 56ch + CTA `acc` "Novo plano"
- Grid responsivo: `grid gap-3.5 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]`
- Plan card: `p-0`, duas regiões separadas por `border-b`
  - Top `p-[22px]`: badge de objetivo (tint colorido 14%) + estrela favorito + nome h2 18px + meta mono
  - Bottom `bg-surface-alt p-[10px_14px]`: chips macros mono + ícones edit/delete ghost
- Badge tints por objetivo:
  - Manutenção → `m-pro` (violet 14%)
  - Emagrecimento → `m-cal` (orange 14%)
  - Ganho de Massa → `m-fat` (teal 14%)

---

## `/planos/:id` — Detalhe do plano

### Header
- Back link mono: "← PLANOS"
- h1 + estrela dourada + badge objetivo + meta mono
- Toggle `Semana | Dia` + "Editar refeições" `sec`

### Vista Dia
- Day tabs
- Card totais: eyebrow + macro line + 4 mini-stats (eyebrow + número mono grande + progress bar 60×3 colorida por macro)
- EditMealCards: header (nome + hora + badge cheat + macros + menu "mais")
  - Body: food rows com `border-b border-line`, cada row = nome + meta macro + input qty (90px mono right-align "g") + kcal calc (64px mono) + delete X
  - Footer: "Adicionar alimento" `sec`
- Menu "mais" (DropdownMenu): "Marcar como livre", "Copiar para outros dias"
- Meal cheat: colapsa body → "Esta refeição não conta nos macros do dia. [Desmarcar]"

### Vista Semana (desktop only — mobile força Dia)
- **Default: Tabela** — min-width 1000px, scroll horizontal. Headers = dias + totais mono. Rows = slots. Cells = foods resumidos ou "Add" ghost dashed.

---

## `/alimentos` — Base de alimentos

- Header: eyebrow "Base de dados" + h1 + descrição + CTA `acc`
- Search: input 40px com ícone + contagem mono `"{N} de {total}"`
- Desktop: tabela em card `p-0`, header `bg-surface-alt` mono uppercase
  - Colunas: Nome (sans 13.5px 500), Porção (mono muted), kcal/P/C/G/Fib (mono colorido por macro), ações ghost
- Mobile (≤780px): lista de cards por alimento
  - Nome + porção topo, ícones edit/delete, grid 4 colunas de mini-stats coloridos

---

## `/refeicoes-prontas` — Presets

- Header: eyebrow "Templates" + h1 + descrição + CTA `acc`
- Cards empilhados, estilo accordion
  - Collapsed: nome + meta mono (count · kcal · P/C/G) + botões ghost (apply/rename/delete)
  - Expanded: body `bg-surface-alt`, rows de food (nome + macros + qty + kcal) + "Adicionar alimento" `sec`
- Nome editável inline no cabeçalho: clicar no nome ou no botão de renomear entra no mesmo modo de edição. Ver `components.md > Edição inline`. Clicar no nome não expande/recolhe o card; o chevron e a linha de macros continuam alternando.
- `PresetNameDialog` é usado **somente para criar** uma refeição pronta.

### Diálogo de aplicar

- Título fixo "Aplicar refeição pronta". A descrição nomeia a refeição pronta de origem e o efeito destrutivo na mesma frase: `Selecione as refeições da semana que vão receber “{nome}”. Os alimentos que já existirem nelas serão substituídos.`
- A origem vive no `DialogHeader`, fora da área rolável (`DialogBody`), então continua visível enquanto a pessoa rola a seleção de refeições.
- `DialogHeader` usa `pr-12` para não passar por baixo do botão de fechar, que é absoluto no `DialogContent`.
- Botão primário informa o alvo: `Aplicar` (desabilitado, nada selecionado), `Aplicar em 1 refeição`, `Aplicar em N refeições` — o número em `.num`.
- O preset é derivado da lista pelo id, não copiado para estado: renomear reflete no diálogo aberto e excluir fecha o diálogo.

- Prévia do que será aplicado (macros + lista de alimentos) no topo do corpo, para não precisar fechar o diálogo.
- Cada célula da grade indica o estado atual da refeição: `vazia`, contagem de alimentos, ou `livre`. Os dados já vêm de `GET /api/meal-plans` — nenhuma chamada extra. Ativado por `showMealState` no `MealSlotGrid`; os outros consumidores da grade não mudam.
- Plano alvo é derivado (`escolhido ?? isMain ?? primeiro`), nunca inicializado uma vez em estado — assim funciona mesmo entrando direto na rota, sem cache. Trocar de plano limpa a seleção **com aviso**.
- Sobrescrever refeição que já tem alimentos exige uma etapa de confirmação **dentro do mesmo diálogo**, nomeando refeição pronta, plano e listando as refeições afetadas. Só refeições vazias aplicam direto — o caminho comum não ganha passo.
- Refeição marcada como livre bloqueia a aplicação com aviso que a identifica; desmarcar libera. Não existe modo de acrescentar sem apagar.
- Falha mantém o diálogo aberto com a seleção e explica o erro; sucesso emite toast com `Desfazer`.
- O estado de seleção mora abaixo do `DialogContent`, que o Radix desmonta ao fechar — cada abertura nasce limpa, sem efeito de reset.
- Checkboxes da grade têm nome acessível (`{refeição} · {dia}`). Botões do rodapé usam `h-11 sm:h-9` para cumprir 44px de toque em mobile.

---

## `/listas-compras` — Listas de compras

- Grid responsivo, gap 14
- List card: badge role ("Proprietário" accent / "Convidado · {nome}" outlined), nome h2 18px + meta count mono
- Bottom `bg-surface-alt`: avatares empilhados com overlap

---

## `/listas-compras/:id` — Detalhe da lista

- 2 colunas (`1fr 320px`, collapsa ≤780px)
- Esquerda: card de itens (checkbox accent + nome + qty/unit mono)
- **Refeição livre não gera itens.** A agregação ignora `IsCheat`, coerente com o resto do app (macros já pulam refeição livre). O vínculo com a lista é mantido: desmarcar "livre" traz os itens de volta sozinho, porque os alimentos nunca são apagados da refeição.
- Os itens são agregados **ao vivo** a cada leitura, a partir das refeições vinculadas — a lista não guarda quantidades congeladas. Editar a refeição atualiza a lista.
- Direita: card de membros (avatar 40px + nome + email mono + role tag)

---

## `/404`

Card centrado. `text-[96px] font-mono` "404" + "Página não encontrada" + link "Voltar ao início".
