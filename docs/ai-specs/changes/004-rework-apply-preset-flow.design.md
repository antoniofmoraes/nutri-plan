# CHG-004 — Design técnico

> Decisão de: [004-rework-apply-preset-flow.md](004-rework-apply-preset-flow.md)
> Status: proposto em 2026-08-25

## Resumo

Um diálogo só, com uma confirmação secundária que aparece **apenas quando há conteúdo a perder**. O estado do diálogo passa a nascer com a abertura, em vez de ser remendado por efeitos. Nenhuma mudança no contrato da API.

## 1. Forma do fluxo

**Decisão: diálogo único revisado + confirmação secundária condicional.**

Descartado:

- **Etapas explícitas (wizard)**: alongaria o caminho comum, violando R10. Escolher alvos é uma etapa só na cabeça de quem usa.
- **Confirmação embutida no botão primário** (duplo clique / "clique de novo para confirmar"): não tem onde listar quais refeições serão substituídas, que é o núcleo de R5.

O caminho comum — aplicar em refeições vazias — continua com o mesmo número de passos de hoje: abrir → marcar → aplicar. A confirmação só entra quando pelo menos uma refeição selecionada já tem alimentos, ou seja, exatamente quando existe perda a comunicar. Isso satisfaz R10 por construção: o passo extra é proporcional à consequência.

### Estados do botão primário

| Situação | Rótulo | Ação |
|---|---|---|
| Nada selecionado | `Aplicar` (desabilitado) | — |
| Há refeição livre selecionada | `Aplicar` (desabilitado) + aviso | bloqueado (R11) |
| Só refeições vazias | `Aplicar em N refeições` | grava direto |
| Alguma com alimentos | `Aplicar em N refeições` | abre a confirmação |

## 2. Derivação do estado (D1, D2)

**Decisão: mover o estado de seleção para dentro de `DialogContent` e derivar o plano por fallback, sem `useEffect`.**

### D1 — seleção herdada entre aberturas

Causa raiz: `selectedPlanId` e `selectedMealIds` vivem no componente externo, que nunca desmonta. O reset em `handleOpenChange(true)` nunca roda porque o `open` é controlado pelo pai.

Radix desmonta `DialogContent` ao fechar. Então basta que o estado more **abaixo** dessa fronteira:

```
ApplyPresetDialog          → só <Dialog open>, sem estado de seleção
  └ DialogContent          → desmontado ao fechar (Radix)
      └ ApplyPresetForm    → dona de selectedPlanId / selectedMealIds
```

Cada abertura monta um `ApplyPresetForm` novo, com estado inicial limpo. Sem efeito, sem `key`, sem reset manual — a fronteira de montagem passa a ser a fronteira do estado. Preserva a animação de saída, que se perderia se o `<Dialog>` inteiro fosse desmontado.

### D2 — plano indefinido quando os planos ainda não estão em cache

Causa raiz: `useState(() => mealPlans[0]?.id ?? '')` roda uma vez, com a lista vazia, e nunca se recupera.

Não guardar o padrão em estado. Guardar só a escolha explícita e derivar o efetivo a cada render:

```ts
const [pickedPlanId, setPickedPlanId] = useState<string | null>(null);
const defaultPlan = mealPlans.find(p => p.isMain) ?? mealPlans[0] ?? null;
const selectedPlan = mealPlans.find(p => p.id === pickedPlanId) ?? defaultPlan;
```

Resiliente ao momento do carregamento: quando os planos chegam, o padrão aparece sozinho. Usa `isMain` como padrão, que é uma escolha melhor que "o primeiro da lista".

Enquanto `useMealPlans().isLoading`, o corpo do diálogo mostra `<LoadingState label="Carregando planos…" />` em vez de uma grade vazia (R2). Sem nenhum plano cadastrado, mostra um `EmptyState` com CTA para criar plano, cobrindo o caso de borda.

## 3. `MealSlotGrid` — o que passa a exibir

**Decisão: prop opt-in, sem afetar o outro consumidor.**

`MealSlotGrid` também é usado por `ShoppingListDetail.tsx`, onde o estado da refeição é irrelevante. A mudança entra como prop opcional:

```ts
showMealState?: boolean;      // default false — ShoppingListDetail não muda
disabledMealIds?: Set<string>;
```

Com `showMealState`, cada célula ganha um indicador do estado atual:

| Estado | Indicador | Origem |
|---|---|---|
| Vazia | `—` em `text-muted` | `meal.foods.length === 0` |
| Com alimentos | contagem mono `N` | `meal.foods.length` |
| Livre | badge `cheat` | `meal.isCheat` |

**Custo de dados: zero.** `GET /api/meal-plans` já inclui `Days.Meals.Foods.Food` (ver `MealPlanService.GetPlansQuery`), então `mealPlans` no cliente já carrega tudo que a grade precisa. Nada de fetch novo, nada de mudança no backend.

A célula segue clicável no estado livre — R11 exige que dê para **desmarcar** uma refeição livre que entrou pelo "Selecionar tudo".

## 4. Confirmação de sobrescrita

**Decisão: diálogo próprio, empilhado sobre o de aplicar.**

Não é um passo do fluxo: é uma porta que só aparece quando há perda. Conteúdo, conforme R5:

- a refeição pronta de origem, por nome;
- o plano alimentar que vai receber;
- a lista das refeições que serão substituídas (dia + slot), não só a contagem;
- ação destrutiva confirmando, cancelar voltando ao diálogo de aplicar **com a seleção intacta**.

`ConfirmDialog` hoje só aceita `description: string`, então não consegue renderizar a lista. Ele já tem exatamente a casca certa (`variant="danger"`, Cancelar/Confirmar, fecha ao confirmar), então **estender é menor que duplicar**: adicionar `children?: ReactNode`, renderizado em um `DialogBody` entre header e footer quando presente. Mudança retrocompatível — os 8 usos atuais, em 6 páginas, não passam `children` e não mudam. Não é abstração nova, é o mesmo componente aceitando corpo.

## 5. Refeição livre — bloqueio (R11)

Bloqueio no cliente, sem mudança de contrato:

- refeições livres selecionadas produzem um aviso no rodapé do diálogo, nomeando cada uma (dia + slot);
- o botão primário fica desabilitado enquanto houver alguma;
- desmarcá-las libera o fluxo.

O backend hoje ignora `IsCheat` e substitui os alimentos de qualquer refeição alvo. Endurecer o `ApplyAsync` para rejeitar refeição livre seria coerente, mas fica **fora do escopo**: CHG-004 declara que o contrato de `POST /api/preset-meals/{id}/apply` não muda. Registrar como item separado se virar requisito.

## 6. D9 — `planId` descartado

Hoje `handleApply(planId, mealIds)` recebe o plano e o ignora, apoiando-se em ids de refeição globalmente únicos. Continua não indo para a API — o endpoint recebe só `targetMealIds`.

Vira **validação explícita**: antes de submeter, o formulário filtra a seleção para as refeições que pertencem ao plano efetivo. Com o estado agora montado por abertura e a troca de plano tratada em R6, a seleção não deveria conter id de outro plano; a validação existe para que essa invariante seja verificável em vez de presumida.

## 7. Interação com CHG-002 (undo)

Aplicar é uma mutação composta e está na matriz de cobertura da [CHG-002](archive/2026-08-25-undo-editing-mutations.md). Esta mudança entrega o toast de sucesso de R7 nomeando a refeição pronta e a quantidade de refeições atualizadas; ele é o ponto onde a CHG-002 vai pendurar a ação `Desfazer`.

Duas notas para o design de undo:

- `ApplyAsync` já é atômico — um `SaveChangesAsync` para todas as refeições alvo — o que favorece a alternativa de snapshot com mutação inversa.
- O snapshot anterior precisa incluir os alimentos **e** o `IsCheat` de cada alvo, mesmo que R11 impeça aplicar sobre refeição livre hoje.

**Atualização 2026-08-25**: a CHG-002 foi implementada primeiro. R7 já está entregue via `useUndoToast`, e o snapshot de aplicar cobre alimentos e `IsCheat` dos alvos. Esta mudança não deve criar contrato de toast próprio.

## Consequências

- `ApplyPresetDialog.tsx` se divide em casca (`Dialog`) e formulário (estado), mudança estrutural que resolve D1 e D2 sem efeito.
- `MealSlotGrid` ganha duas props opcionais; `ShoppingListDetail` não muda.
- Nenhuma migration, nenhum endpoint novo, nenhum campo novo em DTO.
- D3 (sem feedback), D5 (troca de plano silenciosa), D7 (sem prévia) e D8 (`select` cru) continuam sendo tratados nas tarefas T4–T6 da change spec.
