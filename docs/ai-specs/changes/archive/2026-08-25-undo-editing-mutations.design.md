# CHG-002 — Design técnico

> Decisão de: [002-undo-editing-mutations.md](2026-08-25-undo-editing-mutations.md)
> Status: aprovado e implementado em 2026-08-25

## T1 — Audit de feedback (estado atual)

Levantamento sobre `pages/`, `hooks/`, `components/` e `services/` em 2026-08-25.

**Nenhuma mutação da matriz emite toast de sucesso hoje**, com uma exceção. `Foods.tsx` e `MealPlans.tsx` não têm **nenhuma** chamada a `toast` — nem sucesso, nem erro. `PlanDetail.tsx` tem 9 toasts, todos de erro para as mutações da matriz; seus dois `toast.success` são de fluxos fora da matriz (sair do plano, copiar markdown).

| Domínio | Mutações | Sucesso hoje | Erro hoje |
|---|---|---|---|
| Alimentos do catálogo | criar, editar, excluir | nenhum | nenhum |
| Planos | criar, editar, excluir, definir principal | nenhum | nenhum |
| Slots de refeição | adicionar, renomear/horário, excluir, reordenar | nenhum | parcial (`PlanDetail`) |
| Alimentos da refeição | adicionar, trocar, quantidade, remover | nenhum | parcial (`PlanDetail`) |
| Estado/conteúdo da refeição | livre, copiar para dias, aplicar preset | nenhum | parcial (`PlanDetail`) |
| Refeições prontas | criar, renomear, duplicar, excluir, ops de alimento | nenhum¹ | parcial |
| Refeições prontas | copiar por drag-and-drop | **único** (`PresetMeals.tsx:91`) | sim |

¹ Renomear ganhou tratamento de erro na CHG-001, mas não emite sucesso.

Consequência para o planejamento: R1 não é um ajuste pontual. É a introdução de feedback em praticamente toda a matriz, e o custo dele é independente do mecanismo de undo escolhido.

## Fatos do modelo que restringem o design

Levantados no código, não presumidos:

1. **`Food` é catálogo global sem `UserId`.** Criar/editar/excluir exigem `RequireAuthorization("Admin")` (`Program.cs:408-421`). Não é falha de ownership — é catálogo compartilhado. Mas significa que excluir um alimento **cascateia** para `MealFood` e `PresetMealFood` de **todos os usuários** (`AppDbContext`, `DeleteBehavior.Cascade` nas duas relações). Desfazer essa exclusão precisa restaurar linhas que pertencem a outras pessoas.
2. **PKs são `Guid` gerados no cliente** (`Guid.NewGuid()` no default do modelo), não identity do banco. Reinserir com o id original é trivial — nenhuma cerimônia de `IDENTITY_INSERT`.
3. **Só `MealPlan`, `PresetMeal` e `User` têm `UpdatedAt`.** `Meal`, `MealSlot`, `MealFood` e `Food` não têm timestamp nenhum. E `UpdateTimestamps()` só toca entidades `Added`/`Modified`, então alterar um `MealFood` **não** atualiza o `UpdatedAt` do `MealPlan` dono.
4. **`ApplyAsync` já é atômico** — um `SaveChangesAsync` para todas as refeições alvo.

O ponto 3 é o que mata a detecção de conflito por versão sem migration nas tabelas existentes.

## Decisão: snapshot no servidor + endpoint de undo transacional

Das três alternativas exigidas pela change spec:

### Rejeitada — mutações inversas no cliente (alternativa 1)

Quebra em exclusão: recriar a entidade por `POST` gera **id novo**, o que a própria spec proíbe, e não há como recriar as linhas que sumiram por cascade (fato 1). Também não é atômica em operação composta — aplicar preset em 5 refeições viraria 5 requisições, violando R5.

### Rejeitada — exclusão diferida (alternativa 2)

Cobre só exclusão. A matriz exige undo de **edição** (quantidade, renomear, marcar como livre), que a exclusão diferida não endereça — sobraria um segundo mecanismo para o resto.

Pior, ela mente sobre o estado: durante a janela a entidade ainda existe no servidor, só escondida. Recarregar a página no meio da janela mostra o item de volta, contradizendo R4. E exige agendador ou reconfirmação do cliente, que falha se a aba fecha.

### Escolhida — snapshot + `POST /api/undo/{token}` (alternativa 3)

Única que atende R3–R6 com um mecanismo só.

**Fluxo:**

1. Antes de gravar, o service captura um snapshot JSON da subárvore afetada.
2. Grava uma linha em `undo_entries` na **mesma transação** da mutação.
3. A resposta da mutação carrega `undoToken`.
4. `POST /api/undo/{token}` restaura o snapshot em uma transação, com checagem de dono, expiração e conflito.

**Tabela nova** (única mudança de schema; nenhuma tabela existente é alterada):

```
undo_entries
  id           uuid pk
  userId       uuid fk → users
  kind         text        -- "meal.replaceFoods", "food.delete", ...
  snapshot     jsonb       -- estado ANTERIOR da subárvore
  fingerprint  text        -- impressão do estado POSTERIOR (ver conflito)
  createdAt    timestamptz
  expiresAt    timestamptz
  consumedAt   timestamptz null
```

**Atomicidade (R5)**: a restauração roda em `BeginTransactionAsync`, porque reinserir entidades com id explícito pode exigir mais de um `SaveChangesAsync`. Operação composta restaura a subárvore inteira ou nada.

**Ownership**: `undo_entries.userId` tem que bater com `GetUserId(ctx)`. Undo de mutação de catálogo exige a mesma policy `Admin` da mutação original — senão o undo vira um bypass da autorização.

**Conflito (R6) — impressão em vez de versão**: o fato 3 impede comparar `UpdatedAt`. Em vez de adicionar coluna de versão em cinco tabelas, a entrada guarda uma **impressão do estado posterior** — hash do conteúdo da subárvore logo depois da mutação. No undo, o servidor recalcula a impressão do estado atual:

- igual → nada mudou desde então, restaura;
- diferente → algo mais novo aconteceu, responde 409 e não toca em nada.

Sem migration nas tabelas existentes, funciona igual para todos os tipos, e falha para o lado seguro.

**Expiração e limpeza**: `expiresAt` de 5 minutos — folga sobre o toast, que é o limite real de uso (a spec exclui undo depois do toast expirar). Varredura de expirados oportunista na criação de novas entradas; sem job agendado, sem dependência nova.

**Offline / Capacitor**: undo exige rede por construção. Sem conexão, cai no cenário de falha de R6 — mostra "Não foi possível desfazer" e ressincroniza. Como o token vive no servidor, ele sobrevive a restart do app; o que expira é a oferta na tela, não a possibilidade.

**Invalidação do TanStack Query**: a resposta do undo declara os domínios tocados e o cliente invalida `foodKeys`, `mealPlanKeys` e `presetMealKeys` conforme. Undo é raro — invalidar com folga é mais barato que manter um mapa fino de chaves por tipo de operação.

### Por que uma abstração genérica aqui não fere o AGENTS.md §11

O §11 proíbe inventar camada "para o futuro". Aqui o requisito **já** é transversal: 6 domínios, ~25 mutações, com atomicidade e conflito. A alternativa concreta é um endpoint inverso sob medida por mutação — mais código, não menos, e com regra de conflito reimplementada em cada um. Uma tabela e um endpoint são o desenho **menor**, não o mais cerimonioso.

## Contrato de toast acionável (T3)

Helper único sobre o sonner, para não espalhar configuração:

```ts
toastUndo(message: string, undoToken: string)
```

- duração mínima de 8000ms (R7), pausando em hover/foco;
- ação textual `Desfazer` com alvo de toque ≥44px em mobile;
- o token fica capturado no closure, então cada toast empilhado desfaz só a própria mutação (R8);
- ao desfazer: substitui por "Alteração desfeita" ou, em falha, erro em PT-BR sem simular sucesso.

Toasts informativos sem undo continuam com o auto-dismiss atual.

## Faseamento

**Decidido em 2026-08-25: entrega única, sem fases.** Feedback, undo de exclusão e undo de edição/composta saem juntos.

## Consequências

- Uma migration nova (`undo_entries`); nenhuma tabela existente muda.
- Todo service coberto passa a gravar snapshot antes da mutação — custo aceitável na escala atual.
- `UndoService` novo + `MapGroup("/api/undo")`, seguindo o padrão Minimal API + Service.
- Frontend: helper `toastUndo` + hook de undo; hooks de domínio passam a devolver o `undoToken` da mutação.
- Interage com a [CHG-004](2026-08-25-rework-apply-preset-flow.md): o toast de sucesso de aplicar preset (R7 de lá) é onde a ação `Desfazer` se pendura. O snapshot de aplicar precisa incluir alimentos **e** `IsCheat` de cada alvo.

## Decisões tomadas em 2026-08-25

- **Entrega única**, sem fases.
- **Excluir alimento do catálogo fica fora do undo.** Restaurar cascatearia de volta para dados de outros usuários, e a operação é admin-only e rara. Ela continua emitindo toast de sucesso (R1), só não oferece `Desfazer`.
- **Excluir alimento de dentro de uma refeição do usuário continua com undo** — é a operação frequente e a de maior arrependimento. Não confundir as duas: `DELETE /api/foods/{id}` (catálogo, admin, sem undo) vs. `DELETE /api/meals/{mealId}/foods/{foodId}` (refeição do usuário, com undo).
- **Compensação pela falta de undo no catálogo**: a confirmação de exclusão de alimento já existe e nomeia o item (`Foods.tsx`), mas não avisa que o alimento sai de **todos** os planos e refeições prontas que o usam — consequência do cascade do fato 1. Essa descrição passa a declarar o efeito.
