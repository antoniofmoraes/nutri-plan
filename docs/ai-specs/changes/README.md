# Mudanças planejadas

Deltas de comportamento ainda não incorporados às specs vigentes. Cada arquivo deve ser implementável e verificável sem depender do histórico da conversa que o originou.

## Índice ativo

| ID | Mudança | Status | Prioridade |
|---|---|---|---|
| CHG-004 | [Revisitar o fluxo de aplicar refeição pronta](004-rework-apply-preset-flow.md) | Pronta ([design](004-rework-apply-preset-flow.design.md)) | P1 |

## Concluídas

| ID | Mudança | Arquivada em |
|---|---|---|
| CHG-001 | [Editar nome da refeição pronta inline](archive/2026-08-25-edit-preset-name-inline.md) | 2026-08-25 |
| CHG-002 | [Desfazer mutações de alimentos, planos e refeições](archive/2026-08-25-undo-editing-mutations.md) | 2026-08-25 |
| CHG-003 | [Identificar a refeição pronta no diálogo de aplicar](archive/2026-08-25-preset-name-in-apply-dialog.md) | 2026-08-25 |

## Estados

- **Proposta**: intenção registrada; ainda pode conter dúvidas.
- **Precisa de design**: requisitos claros, mas há decisão técnica bloqueante.
- **Pronta**: requisitos, escopo e tarefas permitem implementação.
- **Em andamento**: implementação iniciada.
- **Concluída**: verificada; deve ser incorporada às specs vigentes e arquivada.

## Regras de escrita

- Requisitos usam IDs estáveis (`R1`, `R2`) e descrevem **o que** deve acontecer.
- Cenários usam `DADO / QUANDO / ENTÃO` e cobrem sucesso, cancelamento e falha relevante.
- Tarefas usam checkboxes e citam os requisitos atendidos: `[R1, R2]`.
- Caminhos e componentes atuais podem aparecer nas tarefas, nunca como requisito de produto.
- Decisões não tomadas ficam explícitas em `Dúvidas`; uma IA não deve resolvê-las por suposição.
- Uma mudança concluída atualiza `screens.md`, `components.md`, `backend.md` ou outro contrato vigente afetado antes de ir para `archive/`.

Use [_template.md](_template.md) como ponto de partida. Não crie uma change spec para typo, ajuste mecânico ou bug cuja correção não altere o contrato observado.
