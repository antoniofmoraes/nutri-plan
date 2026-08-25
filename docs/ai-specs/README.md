# AI Specs — PORTIO

Contratos curtos e executáveis para IAs que planejam, geram ou revisam código neste repositório. As specs descrevem comportamento e restrições; o código mostra a implementação atual.

## Arquitetura da documentação

```text
docs/ai-specs/
├── README.md              # entrada, precedência e fluxo
├── guard-rails.md         # invariantes não negociáveis
├── design-tokens.md       # linguagem visual
├── components.md          # contratos de componentes
├── screens.md             # contratos por rota
├── backend.md             # contratos da API
└── changes/               # comportamento proposto, ainda não vigente
    ├── README.md          # ciclo de vida e índice
    ├── _template.md       # formato de uma mudança
    ├── NNN-change-name.md
    └── archive/           # mudanças concluídas e incorporadas
```

As specs temáticas representam a **verdade vigente**. `changes/` contém deltas planejados e não deve ser lido como funcionalidade já entregue.

## O que ler

| Arquivo | Quando ler |
|---|---|
| [guard-rails.md](guard-rails.md) | **Sempre**, antes de UI ou backend |
| [changes/README.md](changes/README.md) | Antes de implementar trabalho planejado |
| [design-tokens.md](design-tokens.md) | CSS, Tailwind, cores, tipo, espaço ou motion |
| [components.md](components.md) | Componentes React, shadcn/ui e feedback |
| [screens.md](screens.md) | Fluxos e layouts de uma rota |
| [backend.md](backend.md) | API .NET, persistência, auth ou contratos wire |

Também leia `AGENTS.md` para convenções gerais. Consulte `docs/design-handoff/reference/index.html` quando faltar detalhe visual.

## Precedência

Quando houver aparente conflito, aplique a regra mais específica nesta ordem:

1. `AGENTS.md` para segurança, stack e convenções do repositório.
2. `guard-rails.md` para invariantes PORTIO.
3. Uma mudança ativa em `changes/`, somente dentro do escopo declarado nela.
4. A spec temática correspondente para o comportamento vigente restante.
5. O protótipo de handoff para detalhes puramente visuais não especificados.

Se código e spec divergirem, não presuma que o código está correto: registre a divergência e confirme a intenção antes de ampliar o escopo.

## Fluxo de uma mudança

1. Descrever intenção, requisitos observáveis e cenários de aceite em `changes/`.
2. Resolver dúvidas marcadas antes de implementar; não inventar requisito.
3. Adicionar design técnico apenas quando houver decisão relevante entre camadas, dados ou contratos.
4. Derivar tarefas pequenas dos requisitos e manter a referência `R#` em cada tarefa.
5. Implementar e verificar os cenários, incluindo 375px e 1440px para UI.
6. Atualizar as specs temáticas com o comportamento entregue.
7. Mover a mudança para `changes/archive/YYYY-MM-DD-change-name.md`.

Correções triviais e mudanças mecânicas não precisam de change spec. Use uma quando o comportamento muda, atravessa arquivos/camadas ou precisa de critérios de aceite.

## Referências adotadas

- [GitHub Spec Kit](https://github.com/github/spec-kit): separa especificação, plano técnico e tarefas; exige cenários de aceite e teste independente.
- [OpenSpec](https://github.com/Fission-AI/OpenSpec): separa a verdade vigente de deltas propostos e arquiva a mudança depois de incorporá-la às specs.
- [Kiro](https://github.com/kirodotdev/Kiro/tree/main/.kiro/specs/github-issue-automation): mantém `requirements.md`, `design.md` e `tasks.md` como artefatos distintos.
- [Google Labs `design.md`](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md): combina estrutura consistente, valores normativos e prosa curta para formar uma fonte legível por humanos e agentes.

O PORTIO adota uma versão deliberadamente menor: uma mudança começa em um único Markdown e só ganha um `design.md` separado se a complexidade justificar.

## Princípio

PORTIO é uma **ferramenta**, não um coach. Sóbrio, preciso, mínimo. Sem gamificação, streaks ou nudges motivacionais.
