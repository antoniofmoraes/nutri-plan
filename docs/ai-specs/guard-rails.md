# Guard Rails — PORTIO

> Leia SEMPRE antes de gerar código. Violações aqui são bugs de design.

---

## Identidade

- PORTIO é uma **ferramenta de planejamento alimentar**, não um coach
- Tom: preciso, confiante, mínimo, sóbrio
- Wordmark: `PORTIO.` — o ponto final é `text-accent`

---

## NÃO faça (design)

- **Cores cruas do Tailwind** (`bg-yellow-500`, `text-gray-600`, `border-slate-200`) — use tokens
- **Cores de macro em UI chrome** — `m-cal/m-pro/m-carb/m-fat/m-fib` são SOMENTE para data-viz
- **Accent como cor de seleção** — seleção em listas usa `bg-ink text-bg`, accent é para ações/marca
- **Accent como sidebar active** — item ativo da sidebar é `bg-ink text-bg`
- **Skeleton screens** — substitua por spinner + gerúndio
- **`dark:` classes manuais** — os tokens CSS já resolvem dark mode automaticamente
- **Hover com scale/zoom** — use shadow + background. Press = `translateY(0.5px)`
- **Framer-motion ou libs de animação** — use as classes existentes (`animate-fade-in`, etc.)
- **Números sem mono** — todo número visível usa `font-mono tabular-nums`
- **Serif fora do auth** — `font-serif` é SOMENTE para a frase itálica nas telas de login/register
- **Cards coloridos** — cards são sempre `bg-surface border-line`, só o conteúdo interno é colorido
- **Pills (rounded-full)** em botões — botões usam `rounded-md` (10px), pills só em badges de status

---

## NÃO faça (features)

- **Tracking de peso/água/corpo** — fora de escopo
- **Streaks, achievements, gamificação** — o app é tool, não coach
- **Copy motivacional** ("Parabéns!", "Continue assim!") — sóbrio sempre
- **Badges de progresso, celebrações** — inexistentes no design
- **Gráficos com Chart.js/Recharts** — macro ring é SVG puro, ~30 linhas

---

## NÃO faça (código)

- **Controllers, Repositories, MediatR, AutoMapper** — Minimal API + Service, ponto
- **Abstrações prematuras** (IService, Generic CRUD, Result<T>) — só na 3ª duplicação
- **Trocar libs estáveis** (axios por fetch+wrapper, Redux por Context) — custo > ganho
- **Fetch direto na página** — use `services/` → `api.get/post/patch/delete`
- **i18n keys** sem necessidade — strings inline em PT-BR por agora
- **Docstrings/comentários** explicando o que — só o porquê quando não óbvio
- **Bug fix + refactor no mesmo PR** — separe

---

## FAÇA (checklist antes de "pronto")

### UI
- [ ] Funciona em 375px (iPhone SE) sem scroll horizontal
- [ ] Funciona em 1440px sem esticar absurdamente (respeita max-w)
- [ ] Sidebar/nav alcançável em mobile (drawer abre)
- [ ] Sem `overflow-x-hidden` mascarando layout quebrado
- [ ] Botão de ação principal visível sem scroll em mobile
- [ ] Empty state com call-to-action implementado
- [ ] Loading state implementado (spinner, não skeleton)
- [ ] Todos os tokens semânticos (zero cores cruas)
- [ ] Números em `font-mono tabular-nums`
- [ ] Eyebrows em `font-mono uppercase tracking-wide text-muted`

### Backend
- [ ] `.RequireAuthorization()` no endpoint
- [ ] Ownership validado no service
- [ ] `ApiException` para erros (nunca 500 manual)
- [ ] `ApiResponses.Ok/Error` como envelope
- [ ] `SaveChangesAsync` (nunca síncrono)

---

## Mobile-first

1. Escreva mobile primeiro, escale para cima: `flex flex-col gap-4 md:flex-row`
2. Toque ≥ 44px em mobile para ações principais
3. Tabelas viram cards abaixo de `md:`
4. Diálogos longos viram drawers em mobile
5. Max 2 colunas em mobile
6. Ações primárias no topo/rodapé fixo em mobile
7. Inputs numéricos: `inputMode="decimal"` + `pattern="[0-9]*"`

---

## Referências rápidas

| O quê | Onde |
|---|---|
| Tokens CSS | `apps/web-app/src/index.css` |
| Tailwind config | `apps/web-app/tailwind.config.ts` |
| Design visual | `docs/design-handoff/reference/index.html` |
| Convenções gerais | `CLAUDE.md` (raiz) |
| Componentes shadcn | `apps/web-app/src/components/ui/` |
| Serviços API | `apps/web-app/src/services/` |
| Backend services | `apps/NutriPlan.Api/Services/` |
| Roteamento API | `apps/NutriPlan.Api/Program.cs` |
