# CHG-003 — Identificar a refeição pronta no diálogo de aplicar

> Status: Concluída  
> Prioridade: P1  
> Specs afetadas: `screens.md`, `components.md`

## Intenção

O diálogo de aplicar não diz qual refeição pronta está sendo aplicada. O título é fixo ("Aplicar refeição pronta") e nada no corpo identifica a origem, então a pessoa que abre o diálogo a partir de uma lista com vários cards perde a referência do que escolheu — e a operação é destrutiva, porque substitui os alimentos das refeições alvo.

## Requisitos

- **R1.** O diálogo de aplicar deve identificar, de forma sempre visível, o nome da refeição pronta que será aplicada.
- **R2.** A identificação deve permanecer visível enquanto a pessoa rola a seleção de refeições alvo, inclusive em 375px.
- **R3.** O aviso de que os alimentos existentes serão substituídos deve continuar associado ao nome, para que a consequência e a origem sejam lidas juntas.
- **R4.** O botão de confirmação deve deixar claro quantas refeições receberão a aplicação, sem depender apenas de um número solto.
- **R5.** Nomes longos não podem quebrar o layout do cabeçalho nem esconder o botão de fechar.

## Cenários de aceite

### Cenário: identificar a origem

- **DADO** uma refeição pronta chamada "Café reforçado"
- **QUANDO** a pessoa aciona `Aplicar` no card dessa refeição
- **ENTÃO** o diálogo exibe "Café reforçado" como a refeição que será aplicada

### Cenário: trocar de refeição pronta

- **DADO** que a pessoa fechou o diálogo aberto para "Café reforçado"
- **QUANDO** ela aciona `Aplicar` no card de "Almoço leve"
- **ENTÃO** o diálogo exibe "Almoço leve", sem resquício da refeição anterior

### Cenário: nome longo

- **DADO** uma refeição pronta com nome de 80 caracteres
- **QUANDO** o diálogo é aberto em 375px
- **ENTÃO** o nome é truncado ou quebrado sem gerar scroll horizontal e sem cobrir o botão de fechar

## Escopo

### Inclui

- `ApplyPresetDialog` e a passagem da refeição pronta selecionada a partir de `PresetMeals`.
- Desktop e mobile, de 375px a 1440px.

### Não inclui

- Redesenho do fluxo de aplicar, tratado em [CHG-004](../004-rework-apply-preset-flow.md).
- Pré-visualização dos alimentos da refeição pronta.
- Mudança no contrato da API.

## Casos de borda

- Diálogo aberto para uma refeição pronta que é excluída ou renomeada em outra aba.
- Refeição pronta sem alimentos: hoje o botão `Aplicar` do card já fica desabilitado; o diálogo não deve abrir sem origem definida.

## Tarefas

- [x] **T1.** [R1, R3, R5] Receber a refeição pronta em `apps/web-app/src/components/preset-meals/ApplyPresetDialog.tsx` e exibir o nome no cabeçalho junto ao aviso de substituição.
- [x] **T2.** [R1] Passar o preset selecionado a partir de `apps/web-app/src/pages/PresetMeals.tsx`, que hoje mantém apenas `applyPresetId`.
- [x] **T3.** [R2, R4] Garantir que a identificação permaneça fixa durante o scroll e ajustar o rótulo do botão de confirmação.
- [x] **T4.** [R1–R5] Verificar abertura consecutiva para presets diferentes e nome longo em 375px e 1440px.
- [x] **T5.** Incorporar o comportamento em `screens.md` e `components.md` e arquivar esta mudança.

## Verificação

- `npm run lint`, `npm run build`.
- Manual: abrir o diálogo por dois presets diferentes em sequência; testar nome longo em 375px.
