# CHG-004 — Revisitar o fluxo de aplicar refeição pronta

> Status: Concluída  
> Prioridade: P1  
> Specs afetadas: `screens.md`, `components.md`

## Intenção

Aplicar uma refeição pronta é a ação de maior consequência da tela e hoje é a menos legível: a pessoa escolhe alvos sem ver o que será gravado, sem ver o que será perdido, e sem confirmação de que algo aconteceu. A operação substitui os alimentos de várias refeições de uma vez e não tem retorno. Esta mudança revisa o fluxo inteiro, da abertura à confirmação.

## Defeitos observados hoje

Levantados no código atual e tratados como sintomas a resolver, não como requisitos de implementação.

| # | Sintoma | Onde |
|---|---|---|
| D1 | A seleção de refeições alvo não é limpa entre aberturas: o reset só roda quando `onOpenChange` recebe `true`, o que não acontece porque o diálogo é controlado por `applyPresetId` no pai. Abrir para outro preset herda a seleção anterior. **Reproduzido em 2026-08-25**: com 28 refeições marcadas, fechar e abrir para outro preset mantém "Aplicar em 28 refeições" e o botão já habilitado. | `ApplyPresetDialog.tsx` |
| D2 | `selectedPlanId` é inicializado uma única vez, quando `mealPlans` ainda é uma lista vazia. Sem plano selecionado, a grade de refeições não renderiza e o botão nunca habilita. O diálogo só funciona quando os planos já estão no cache do TanStack Query, então falha de forma intermitente conforme a navegação. | `ApplyPresetDialog.tsx` |
| D3 | ~~Aplicar não emite nenhum feedback de sucesso.~~ **Resolvido pela CHG-002 em 2026-08-25**: aplicar emite toast com `Desfazer`. | `usePresetMeals.ts` |
| D4 | A substituição destrutiva é anunciada por uma linha de descrição e não tem confirmação, mesmo aplicando a muitas refeições de uma vez. | `ApplyPresetDialog.tsx` |
| D5 | Trocar o plano no seletor descarta silenciosamente a seleção já feita. | `ApplyPresetDialog.tsx` |
| D6 | A grade não mostra quais refeições alvo já têm alimentos, quais estão vazias e quais estão marcadas como livres, então não dá para saber o que será sobrescrito. | `MealSlotGrid.tsx` |
| D7 | Não há pré-visualização do conteúdo da refeição pronta durante a escolha dos alvos. | `ApplyPresetDialog.tsx` |
| D8 | O seletor de plano é um `select` cru, fora do design system. | `ApplyPresetDialog.tsx` |
| D9 | `handleApply` recebe o id do plano e o descarta, dependendo de os ids de refeição serem globalmente únicos. | `PresetMeals.tsx` |

## Requisitos

- **R1.** Abrir o diálogo deve sempre partir de um estado limpo, sem herdar seleção, plano ou rolagem de uma abertura anterior.
- **R2.** O plano alvo deve estar selecionado e utilizável assim que o diálogo abre, independentemente de os planos já estarem em cache. Enquanto os planos carregam, o diálogo deve comunicar carregamento em vez de exibir uma grade vazia.
- **R3.** A pessoa deve conseguir ver o que será aplicado — nome e conteúdo da refeição pronta — sem fechar o diálogo.
- **R4.** Cada refeição alvo deve indicar seu estado atual (vazia, com alimentos ou livre), para que a perda de conteúdo seja previsível antes de confirmar.
- **R5.** Quando a aplicação sobrescrever refeições que já têm alimentos, a pessoa deve confirmar explicitamente em uma etapa própria. A confirmação deve identificar **quais** refeições serão substituídas, **qual** refeição pronta está sendo aplicada e **qual** plano alimentar vai recebê-la.
- **R6.** Trocar o plano não pode descartar a seleção sem aviso; se o descarte for inevitável, precisa ser comunicado.
- **R7.** Toda aplicação concluída deve emitir feedback de sucesso identificando a refeição pronta e quantas refeições foram atualizadas.
- **R8.** Falha na aplicação deve manter o diálogo utilizável, preservar a seleção e explicar o erro em PT-BR, sem fechar como se tivesse dado certo.
- **R9.** O fluxo deve ser operável por teclado e cumprir alvo de toque de 44px em mobile, de 375px a 1440px.
- **R10.** Nenhuma etapa nova pode ser adicionada sem remover confusão equivalente: o caminho comum, aplicar em poucas refeições, não pode ficar mais longo do que é hoje.
- **R11.** Refeição marcada como livre não pode receber uma refeição pronta. Enquanto houver refeição livre selecionada, o fluxo fica bloqueado com um aviso que a identifica; a pessoa desmarca a refeição para conseguir aplicar. Substituir é o único comportamento — não existe modo de acrescentar sem apagar.

## Cenários de aceite

### Cenário: aberturas consecutivas

- **DADO** que a pessoa abriu o diálogo para um preset e selecionou três refeições
- **QUANDO** ela cancela e abre o diálogo para outro preset
- **ENTÃO** nenhuma refeição aparece selecionada e o plano volta ao padrão

### Cenário: entrar direto na tela

- **DADO** um acesso direto a `/refeicoes-prontas`, sem passar por outra tela
- **QUANDO** a pessoa abre o diálogo de aplicar
- **ENTÃO** o plano vem selecionado e a grade de refeições é utilizável, sem exigir recarregar ou renavegar

### Cenário: sobrescrever conteúdo existente

- **DADO** que duas das refeições alvo já têm alimentos
- **QUANDO** a pessoa confirma a aplicação
- **ENTÃO** uma confirmação lista as duas refeições que serão substituídas, nomeia a refeição pronta de origem e o plano alvo, e a gravação só ocorre após aceite

### Cenário: apenas refeições vazias

- **DADO** que todas as refeições alvo estão vazias
- **QUANDO** a pessoa confirma a aplicação
- **ENTÃO** a gravação ocorre direto, sem etapa de confirmação

### Cenário: refeição livre selecionada

- **DADO** que uma das refeições selecionadas está marcada como livre
- **QUANDO** a pessoa tenta aplicar
- **ENTÃO** o fluxo fica bloqueado com um aviso que identifica a refeição livre, e só é liberado quando ela é desmarcada

### Cenário: aplicação concluída

- **DADO** uma seleção válida
- **QUANDO** a API confirma a aplicação
- **ENTÃO** aparece feedback de sucesso citando a refeição pronta e o número de refeições atualizadas

### Cenário: falha ao aplicar

- **DADO** uma seleção válida
- **QUANDO** a API rejeita a aplicação
- **ENTÃO** o diálogo continua aberto com a seleção preservada e o erro é explicado em PT-BR

## Escopo

### Inclui

- `ApplyPresetDialog`, o estado de aplicação em `PresetMeals` e o uso de `MealSlotGrid` nesse contexto.
- Feedback de sucesso e de erro da aplicação.
- Desktop, mobile web e shell Capacitor.

### Não inclui

- Desfazer a aplicação, coberto por [CHG-002](2026-08-25-undo-editing-mutations.md).
- Alterar o contrato de `POST /api/preset-meals/{id}/apply`.
- Aplicar várias refeições prontas de uma vez.
- Mudar o fluxo equivalente de copiar refeição dentro do plano.

## Casos de borda

- Nenhum plano cadastrado: o caminho até criar um plano precisa ser compreensível, não um diálogo vazio.
- Plano sem slots configurados.
- Refeição alvo marcada como livre.
- Preset excluído em outra aba enquanto o diálogo está aberto.
- Seleção de muitas refeições em 375px, onde a grade vira lista.

## Design técnico obrigatório

Antes de implementar, registrar a decisão em `changes/004-rework-apply-preset-flow.design.md`.

A decisão deve definir, no mínimo:

1. a forma do fluxo — diálogo único revisado, etapas explícitas ou diálogo com confirmação secundária — e por que ela reduz confusão sem alongar o caminho comum (R10);
2. como o estado do diálogo é derivado da abertura, resolvendo D1 e D2 na origem em vez de remendar com efeitos;
3. o que `MealSlotGrid` passa a exibir e se a mudança é local a este fluxo ou afeta os outros usos do componente;
4. se a confirmação de sobrescrita é um passo próprio ou parte do botão primário.

Verificar se D9 deixa de importar ou vira validação explícita, e se as decisões acima interagem com o desenho de undo da CHG-002.

## Tarefas

- [x] **T1.** [R1–R11] Mapear o fluxo atual ponta a ponta e confirmar D1–D9 em execução, registrando quais são reproduzíveis. D1 já confirmado em 2026-08-25.
- [x] **T2.** Produzir e aprovar [`004-rework-apply-preset-flow.design.md`](2026-08-25-rework-apply-preset-flow.design.md) antes de alterar componentes.
- [x] **T3.** [R1, R2] Corrigir a derivação de estado do diálogo, incluindo seleção limpa por abertura e plano padrão resiliente ao carregamento.
- [x] **T4.** [R3, R4, R6] Implementar a leitura do que será aplicado e do estado atual de cada refeição alvo.
- [x] **T5.** [R5, R8, R11] Implementar a confirmação de sobrescrita (estendendo `ConfirmDialog` com `children`), o bloqueio de refeição livre e o tratamento de falha sem fechar o diálogo.
- [x] **T6.** [R7] Feedback de sucesso da aplicação entregue pela CHG-002 (`useUndoToast`), já citando a quantidade de refeições atualizadas.
- [x] **T7.** [R9] Verificar teclado, alvos de toque e layout em 375px, 900px, 1024px e 1440px.
- [x] **T8.** [R1–R10] Cobrir com testes a limpeza de estado entre aberturas e o caminho de sobrescrita.
- [x] **T9.** Atualizar `screens.md` e `components.md` e arquivar esta mudança. A CHG-003 já foi entregue e incorporada: o diálogo já identifica o preset de origem e o botão primário já nomeia o alvo, então não repita esse escopo.

## Verificação

- `npm test`, `npm run lint`, `npm run build`.
- Manual: aplicar em uma refeição vazia, em uma com conteúdo e em várias de uma vez; entrar direto na rota sem cache; cancelar e reabrir para outro preset.

## Dúvidas

Resolvidas em 2026-08-25 e incorporadas em R5 e R11:

- **Substituir vs. acrescentar** → substituir continua sendo o único comportamento, protegido por uma confirmação própria que mostra quais refeições serão substituídas, qual refeição pronta e qual plano.
- **Refeição livre** → bloqueia o fluxo inteiro com aviso; a pessoa precisa desmarcar a refeição para aplicar.
