# CHG-001 — Editar nome da refeição pronta inline

> Status: Concluída  
> Prioridade: P1  
> Specs afetadas: `screens.md`, `components.md`

## Intenção

Reduzir a fricção para renomear uma refeição pronta. Hoje o nome é somente leitura no card e a edição abre `PresetNameDialog`; a alteração deve acontecer no próprio cabeçalho do card.

## Requisitos

- **R1.** O nome de cada refeição pronta deve ser editável inline no cabeçalho do `PresetCard`.
- **R2.** Clicar no nome ou acionar o controle de renomear deve entrar no mesmo modo de edição, com o texto atual selecionado e foco visível.
- **R3.** `Enter` ou perda de foco deve salvar o valor sem espaços nas extremidades; `Escape` deve cancelar e restaurar o valor anterior.
- **R4.** Nome vazio não deve ser enviado. A interface mantém o valor anterior, continua compreensível por teclado e comunica a validação em PT-BR.
- **R5.** Durante o salvamento, apenas uma requisição pode ser enviada. Em falha, o nome anterior reaparece e um toast de erro explica que a alteração não foi salva.
- **R6.** O diálogo permanece para criar uma refeição pronta, mas deixa de ser usado para renomear.

## Cenários de aceite

### Cenário: renomear pelo próprio card

- **DADO** uma refeição pronta chamada “Café da manhã”
- **QUANDO** a pessoa edita o título para “Café reforçado” e pressiona `Enter`
- **ENTÃO** o card exibe “Café reforçado” e o valor persiste após recarregar a página

### Cenário: cancelar a edição

- **DADO** uma edição inline em andamento
- **QUANDO** a pessoa pressiona `Escape`
- **ENTÃO** o input fecha sem requisição e o nome anterior continua visível

### Cenário: impedir valor vazio

- **DADO** uma edição inline em andamento
- **QUANDO** a pessoa apaga o texto e tenta salvar
- **ENTÃO** nenhum update é enviado e a interface informa “Nome obrigatório” sem perder o contexto do card

### Cenário: falha ao salvar

- **DADO** um novo nome válido
- **QUANDO** a API rejeita ou não conclui a atualização
- **ENTÃO** o nome anterior é restaurado e um toast de erro em PT-BR é exibido

## Escopo

### Inclui

- Mouse, toque e teclado.
- Cards recolhidos ou expandidos.
- Layouts de 375px a 1440px.
- Reuso de `updatePresetMeal`; não há mudança esperada no contrato da API.

### Não inclui

- Edição inline de alimentos ou de nomes de planos.
- Renomear várias refeições prontas simultaneamente.
- Alterar o fluxo de criação.

## Casos de borda

- Salvar um nome idêntico após `trim` fecha a edição sem request.
- Um clique no título em modo de leitura não pode expandir/recolher o accordion por acidente.
- O input não pode empurrar as ações para fora do card nem causar scroll horizontal em 375px.

## Tarefas

- [x] **T1.** [R1, R2, R3] Extrair ou implementar o editor de nome inline em `apps/web-app/src/components/preset-meals/PresetCard.tsx`.
- [x] **T2.** [R4, R5] Tratar validação, estado de salvamento, falha e restauração do valor anterior.
- [x] **T3.** [R2, R6] Redirecionar a ação de renomear para o modo inline e manter `PresetNameDialog` apenas para criação em `apps/web-app/src/pages/PresetMeals.tsx`.
- [x] **T4.** [R1–R6] Testar salvar, cancelar, valor vazio e falha; verificar também 375px e 1440px no navegador.
- [x] **T5.** Incorporar o comportamento entregue em `screens.md` e arquivar esta mudança.

## Verificação

- `npm test`
- `npm run lint`
- `npm run build`
- Teste manual com mouse, teclado e toque em 375px e 1440px.
