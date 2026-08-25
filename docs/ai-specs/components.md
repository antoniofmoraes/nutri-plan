# Componentes — PORTIO

> Base: shadcn/ui. Override de estilos via tokens PORTIO.
> Referência visual: `docs/design-handoff/reference/ui.jsx`

---

## Button

5 variantes. Mapear via CVA no shadcn `<Button>`.

| Variante | `bg` | `text` | `border` | Quando |
|---|---|---|---|---|
| `pri` | `ink` | `bg` | nenhum | Ação primária em dialogs |
| `acc` | `accent` | `accent-ink` | nenhum | CTAs de página ("Criar", "Novo") |
| `sec` | `surface` | `ink` | `line` | Secundário ("Editar refeições") |
| `ghost` | transparente | `ink` | nenhum | Ícones, menus |
| `danger` | transparente | `danger` | `line` | Destrutivo secundário |

Tamanhos: `lg=44px`, `default=36px`, `sm=30px`, `xs=26px`.
Raio escala: `10/10/8/6px`.
Press: `active:translate-y-[0.5px]`.

---

## Card

```
bg-surface border border-line rounded-lg shadow-1 p-[22px]
```
- Compacto: `p-4`
- Hover interativo: `hover:shadow-2 cursor-pointer`
- Cards NUNCA são coloridos — só o conteúdo dentro

---

## Input

```
h-10 px-3 border border-line rounded bg-surface text-ink
focus:border-ink (sem glow, sem ring)
```
- Com ícone: `pl-[38px]`, ícone posição `left-3 top-1/2 -translate-y-1/2 text-muted`
- Label acima: `font-mono uppercase text-xs text-muted tracking-[0.06em] mb-1.5`

---

## Edição inline

Valor em modo leitura é um `button` (`cursor-text`, `hover:bg-surface-alt`); clicar troca por um input que herda a tipografia do texto original. Usado em quantidade de alimento (`InlineQuantityEdit`, `InlineFoodSwap`) e no nome da refeição pronta (`InlineNameEdit`).

Contrato de comportamento:

- Entrar em edição seleciona o texto atual e move o foco para o input.
- `Enter` e perda de foco salvam com `trim`; `Escape` cancela e restaura o valor anterior.
- Valor igual após `trim` fecha sem requisição.
- Valor inválido não é enviado: o input permanece aberto com `aria-invalid`, `border-danger` e mensagem `role="alert"` em PT-BR. Sair do campo com valor inválido cancela e mantém o valor anterior.
- Salvamento em voo bloqueia novos commits (`Enter` seguido de blur envia uma requisição só).
- Falha restaura o valor anterior e emite `toast.error` em PT-BR — nunca deixa o valor otimista na tela.
- Em modo leitura, o clique no valor não pode disparar a ação do contêiner (expandir card, navegar).
- O input não pode empurrar ações para fora do card nem gerar scroll horizontal em 375px.

---

## Badge (status tag)

```
font-mono uppercase text-[10.5px] font-medium tracking-[0.08em]
px-2 py-1 rounded-full border border-line
```
Variantes:
- `outlined` (padrão): `bg-surface text-ink border-line`
- `solid`: `bg-ink text-bg border-ink`
- `accent`: `bg-accent-soft text-accent border-transparent`
- `good`: `bg-good/12 text-good border-transparent`
- `warn`: `bg-warn/12 text-warn border-transparent`
- `cheat`: `bg-accent text-accent-ink` (fundo cheio)

---

## Chip (food tag)

```
font-sans text-[12.5px] px-[9px] py-[5px] rounded-[8px]
bg-surface-alt border border-line
```
Quantidade dentro: `font-mono text-[11px] text-muted`

---

## Tabs (segmented control)

Container: `bg-surface-alt border border-line p-[3px] gap-[2px] rounded`
Tab ativo: `bg-surface shadow-1`
Tab inativo: `text-muted hover:text-ink`

---

## Day tabs (seletor de dia da semana)

Grid de 7 colunas, `gap-1.5`.
Cada tab: `border border-line bg-surface rounded px-2 py-2.5`
- Ativo: `bg-ink text-bg` (sólido, invertido)
- Data em mono abaixo do nome do dia
- Mobile: letras únicas (`S T Q Q S S D`), sem número

---

## Dialog

- Backdrop: `rgba(20,18,12,.45)`
- Max-width: `480px` (padrão) ou `640px` (`.lg`)
- `border-line rounded-lg shadow-3`
- 3 regiões: header (título+descrição), body (`gap-3.5`), footer (`border-t bg-surface justify-end gap-2`)
- Enter: `animate-fade-in` (150ms, scale .97→1)

---

## Dialog — origem e alvo de ação destrutiva

Quando o diálogo age sobre uma entidade escolhida fora dele, o `DialogHeader` deve nomear essa entidade, porque ele fica fora da área rolável e permanece visível durante a seleção. Origem e consequência ficam na mesma frase, para serem lidas juntas.

- Conteúdo vindo de dado do usuário no header pede `pr-12` (o botão de fechar é `absolute right-4`, 30px) e `break-words`.
- O botão primário nomeia o alvo em vez de exibir um número solto: `Aplicar em 3 refeições`, não `Aplicar (3)`. Número em `.num`.

**Confirmação de perda**: quando a ação sobrescreve conteúdo, confirme em uma **etapa dentro do mesmo diálogo** (troca header/body/footer), não em um segundo `Dialog` empilhado — dois modais sobrepostos ficam apertados em 375px, e voltar preserva a seleção de graça por ser o mesmo componente. A etapa só aparece quando existe perda real; sem perda, a ação grava direto.

**Estado por abertura**: o Radix desmonta `DialogContent` ao fechar. Estado que deve nascer limpo a cada abertura mora em um componente **abaixo** dessa fronteira — nunca no componente que controla `open`, que não desmonta. Isso dispensa `useEffect` de reset.

**Rodapé em mobile**: ações do `DialogFooter` usam `className="h-11 sm:h-9"` para cumprir os 44px de alvo de toque.

---

## Toast com Desfazer

Toda mutação de alimento, plano ou refeição confirma o que aconteceu. Quando é reversível, o toast carrega a ação `Desfazer`.

- Use `useUndoToast()` (`hooks/useUndo.ts`): `undoToast(mensagem, undoToken)`.
- Sem `undoToken`, degrada para `toast.success` comum — é o caso de mutação fora da cobertura de undo.
- Duração mínima de 8s em toast acionável; o token fica no closure, então toasts empilhados desfazem cada um a sua própria mutação.
- Desfazer é servidor: `POST /api/undo/{token}`. Falha ou conflito mostra erro em PT-BR e ressincroniza — nunca corrige só o cache.
- Operação composta (aplicar preset, copiar refeição, copiar alimentos entre refeições prontas) é **uma** chamada de API, para o undo reverter o conjunto inteiro. Não faça laço de mutação no cliente.

---

## Toast (sonner)

- Posição: bottom-right
- Visual: `bg-ink text-bg rounded px-4 py-3`
- Auto-dismiss: 2.8s
- Ícone: verde (success) ou vermelho (error)
- Enter: `animate-toast-in`
- Toast com ação `Desfazer` usa 8s em vez do auto-dismiss padrão — ver acima.

---

## Avatar

- `w-8 h-8 rounded-lg bg-surface-alt border border-line`
- Iniciais: `font-mono text-[11px] font-semibold`
- Grande: `w-10 h-10`
- Stack: `ml-[-6px] border-2 border-surface-alt`

---

## Macro Ring (donut SVG)

- Dimensão padrão: `220×220`, stroke `18px`, track `surface-alt`
- Segmentos por kcal share: proteína(`m-pro`) → carb(`m-carb`) → fat(`m-fat`)
- Centro: eyebrow "Calorias" + número grande mono 30px + meta "de {target} kcal"
- Legenda: quadrado 8×8 colorido + label + gramas mono + % mono
- **NÃO** usar Chart.js/Recharts — é SVG puro (~30 linhas)

---

## Empty state

```
card, text-center, p-12 px-8
→ div 56×56 rounded-full bg-accent-soft flex items-center justify-center
  → ícone accent
→ h2 text-[19px] font-semibold
→ p text-muted max-w-[360px]
→ Button variante acc
```

---

## Loading

**Sem** skeletons. Substitua label do botão por spinner + gerúndio PT:
```
<spinner 16×16 border-[1.5px] currentColor top-transparent animate-spin /> Entrando…
```

---

## Seleção em listas

Selecionado = `bg-ink text-bg`. **Não** usar accent para seleção — accent é para ações e marca.
