# CHG-002 — Desfazer mutações de alimentos, planos e refeições

> Status: Concluída  
> Prioridade: P1  
> Specs afetadas: `components.md`, `screens.md`, `backend.md`

## Intenção

Dar recuperação imediata para alterações acidentais. Toda mutação bem-sucedida de alimentos, planos ou refeições deve produzir feedback consistente no toast global e permitir desfazer a operação enquanto a ação estiver disponível.

## Requisitos

- **R1.** Toda mutação bem-sucedida dentro da matriz de cobertura deve exibir um toast de sucesso no canto da tela; fluxos que hoje não dão feedback devem passar a dar.
- **R2.** O toast deve oferecer a ação textual `Desfazer`, com alvo de toque acessível, enquanto a operação puder ser revertida.
- **R3.** Acionar `Desfazer` deve restaurar exatamente o estado anterior persistido, atualizar as queries afetadas e confirmar “Alteração desfeita”.
- **R4.** O undo deve ser persistente no servidor, não apenas uma correção visual no cache. Recarregar a página após desfazer preserva o estado restaurado.
- **R5.** Exclusões, cópias, aplicação de refeição pronta e outras operações compostas devem ser atômicas: o undo restaura todo o conjunto ou não altera nada.
- **R6.** Falha ou conflito ao desfazer não pode sobrescrever uma alteração mais nova; deve manter o estado atual e mostrar erro em PT-BR.
- **R7.** Toasts informativos mantêm o auto-dismiss atual. Toasts com ação devem permanecer visíveis por tempo suficiente para leitura e toque, com mínimo de 8 segundos, e pausar enquanto houver hover ou foco.
- **R8.** Cada toast empilhado deve desfazer somente a mutação que o originou; a ordem visual não altera a associação entre ação e operação.

## Matriz de cobertura

| Domínio | Mutações cobertas |
|---|---|
| Alimentos do catálogo | criar, editar e excluir — **excluir só com toast, sem `Desfazer`** (ver abaixo) |
| Planos | criar, editar, excluir e definir/remover como principal |
| Slots de refeição | adicionar, renomear/alterar horário, excluir e reordenar |
| Alimentos da refeição | adicionar, trocar, alterar quantidade e remover |
| Estado/conteúdo da refeição | marcar/desmarcar como livre, copiar para outros dias e aplicar refeição pronta |
| Refeições prontas | criar, renomear, duplicar, excluir, adicionar/trocar/alterar quantidade/remover alimento e copiar por drag-and-drop |

Exportar, copiar texto, autenticação, convites, permissões de compartilhamento e listas de compras ficam fora desta mudança porque não editam os três domínios definidos acima.

**Exceção a R2, decidida em 2026-08-25**: excluir um alimento do **catálogo** (`DELETE /api/foods/{id}`, admin) não oferece `Desfazer`. O alimento cascateia para as refeições e refeições prontas de todos os usuários, então restaurá-lo reescreveria dados de terceiros. Em compensação, a confirmação de exclusão declara esse efeito antes de gravar. Excluir um alimento **de dentro de uma refeição** (`DELETE /api/meals/{mealId}/foods/{foodId}`) continua com undo normal.

## Cenários de aceite

### Cenário: fluxo que ainda não possui toast de sucesso

- **DADO** uma edição válida em alimento, plano ou refeição
- **QUANDO** a API confirma a mutação
- **ENTÃO** aparece um toast de sucesso com a ação `Desfazer`

### Cenário: desfazer edição simples

- **DADO** que a quantidade de um alimento foi alterada de `100g` para `150g`
- **QUANDO** a pessoa aciona `Desfazer`
- **ENTÃO** a quantidade persistida volta a `100g`, os macros são recalculados e o estado continua correto após reload

### Cenário: desfazer exclusão

- **DADO** que um alimento, plano, slot ou refeição pronta foi excluído
- **QUANDO** a pessoa aciona `Desfazer` no toast correspondente
- **ENTÃO** a entidade e seus relacionamentos cobertos são restaurados com os mesmos dados anteriores

### Cenário: desfazer operação composta

- **DADO** uma refeição pronta aplicada a uma ou mais refeições
- **QUANDO** a pessoa aciona `Desfazer`
- **ENTÃO** todas as refeições alvo voltam ao snapshot anterior em uma única operação atômica

### Cenário: alteração posterior conflitante

- **DADO** uma mutação A com undo disponível e uma mutação B posterior sobre o mesmo estado
- **QUANDO** desfazer A sobrescreveria B
- **ENTÃO** o servidor rejeita o undo com erro de conflito e B permanece intacta

### Cenário: falha de rede no undo

- **DADO** uma mutação concluída
- **QUANDO** a tentativa de desfazer falha
- **ENTÃO** a UI sincroniza novamente com o servidor e mostra “Não foi possível desfazer” sem simular sucesso

## Escopo

### Inclui

- Desktop, mobile web e shell Capacitor.
- Feedback ausente nos fluxos da matriz.
- Concorrência entre toasts e proteção contra estado mais novo.
- Testes de reversão simples, destrutiva e composta.

### Não inclui

- Histórico permanente de versões.
- Redo, pilha de comandos ou tela de auditoria.
- Undo após o toast expirar.
- Reverter ações de outro usuário em plano compartilhado.

## Design técnico obrigatório

Antes da implementação, registrar a decisão em `changes/002-undo-editing-mutations.design.md`.

A decisão deve comparar, no mínimo:

1. mutações inversas com snapshot e controle de versão;
2. exclusão diferida enquanto o toast está ativo;
3. token/endpoint de undo transacional no backend.

O design escolhido deve explicar atomicidade, ownership, expiração, conflitos, limpeza, comportamento offline/Capacitor e invalidação do TanStack Query. Não recrie entidades excluídas no frontend com novos IDs: isso não restaura referências com fidelidade.

## Tarefas

- [x] **T1.** [R1] Auditar a matriz contra páginas, componentes, hooks e services; listar mutações sem toast de sucesso. Resultado em [`002-undo-editing-mutations.design.md`](2026-08-25-undo-editing-mutations.design.md).
- [x] **T2.** [R3–R6] Produzir [`002-undo-editing-mutations.design.md`](2026-08-25-undo-editing-mutations.design.md). **Aguardando aprovação** antes de alterar contratos.
- [x] **T3.** [R2, R7, R8] Definir o contrato reutilizável de toast acionável sobre Sonner, incluindo duração, foco e associação com a mutação.
- [x] **T4.** [R3–R6] Implementar o suporte backend escolhido com auth, ownership, atomicidade e conflito onde necessário.
- [x] **T5.** [R1–R8] Integrar alimentos do catálogo e planos; adicionar feedback onde ele não existe.
- [x] **T6.** [R1–R8] Integrar slots, alimentos de refeições, refeição livre, cópia e aplicação de refeição pronta.
- [x] **T7.** [R1–R8] Integrar refeições prontas, inclusive alterações inline e drag-and-drop.
- [x] **T8.** [R3–R8] Cobrir reversão simples, exclusão, operação composta, conflito, expiração e falha de rede com testes proporcionais ao risco.
- [x] **T9.** Verificar fluxos em 375px, 1440px e Capacitor; atualizar as specs vigentes e arquivar esta mudança.

## Verificação

- Frontend: `npm test`, `npm run lint`, `npm run build`.
- Backend: `dotnet build` e testes de integração dos contratos de undo adicionados.
- Manual: executar e desfazer ao menos uma mutação de cada linha da matriz, inclusive após navegação e com dois toasts empilhados.
