# CHG-NNN — Título orientado ao resultado

> Status: Proposta  
> Prioridade: P1 | P2 | P3  
> Specs afetadas: `screens.md`, `components.md`, `backend.md`

## Intenção

Problema e resultado esperado em poucas linhas. Não prescrever tecnologia aqui.

## Requisitos

- **R1.** Comportamento observável e inequívoco.
- **R2.** Regra de erro, permissão ou consistência relevante.

## Cenários de aceite

### Cenário: resultado principal

- **DADO** um estado inicial verificável
- **QUANDO** a pessoa executa uma ação
- **ENTÃO** o resultado observável acontece

## Escopo

### Inclui

- Fluxos, entidades e plataformas cobertos.

### Não inclui

- Limites explícitos para evitar expansão acidental.

## Casos de borda

- Cancelamento, concorrência, falha de rede, estado vazio ou responsividade relevante.

## Design técnico

Opcional. Torne obrigatório se a mudança atravessar camadas, alterar contrato ou exigir migração/estratégia de persistência. Registre decisão e motivo, não um tutorial de implementação.

## Tarefas

- [ ] **T1.** [R1] Alteração atômica com caminho de arquivo quando conhecido.
- [ ] **T2.** [R1, R2] Teste ou verificação que prova o comportamento.

## Verificação

- Comando automatizado relevante.
- Fluxo manual e viewports quando houver UI.

## Dúvidas

- Pergunta que muda materialmente o resultado. Remova a seção quando estiver resolvida.
