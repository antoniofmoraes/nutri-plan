# Design Tokens — PORTIO

> Fonte: `apps/web-app/src/index.css` + `apps/web-app/tailwind.config.ts`
> Referência visual: `docs/design-handoff/reference/index.html`

## Cores — use SEMPRE tokens Tailwind

### Superfícies
| Tailwind class | CSS var | Uso |
|---|---|---|
| `bg-bg` | `--bg` | Fundo da página |
| `bg-paper` | `--paper` | Sidebar, dialogs, auth form |
| `bg-surface` | `--surface` | Cards |
| `bg-surface-alt` | `--surface-alt` | Hover, table headers, chips |
| `bg-surface-2` | `--surface-2` | Linhas alternadas |

### Texto
| Tailwind class | CSS var | Uso |
|---|---|---|
| `text-ink` | `--ink` | Texto primário |
| `text-ink-2` | `--ink-2` | Texto secundário |
| `text-muted` | `--muted` | Meta, labels |
| `text-muted-2` | `--muted-2` | Placeholder, disabled |

### Ações / Status
| Tailwind class | CSS var | Uso |
|---|---|---|
| `bg-accent` / `text-accent` | `--accent` | CTA, marca (laranja `#ff4d2e`) |
| `text-accent-ink` | `--accent-ink` | Texto sobre accent |
| `bg-accent-soft` | `--accent-soft` | Tint suave de accent |
| `text-good` | `--good` | Sucesso |
| `text-warn` | `--warn` | Alerta |
| `text-danger` | `--danger` | Erro, ação destrutiva |

### Macro data-viz (SOMENTE em gráficos/números — NUNCA em UI chrome)
| Tailwind | Cor | Macro |
|---|---|---|
| `text-m-cal` / `bg-m-cal` | `#ff4d2e` | Calorias |
| `text-m-pro` / `bg-m-pro` | `#4a3df0` | Proteína |
| `text-m-carb` / `bg-m-carb` | `#e6b22b` | Carboidratos |
| `text-m-fat` / `bg-m-fat` | `#1f9b8f` | Gordura |
| `text-m-fib` / `bg-m-fib` | `#7a766a` | Fibra |

### Bordas e sombras
| Tailwind | Uso |
|---|---|
| `border-line` | Borda padrão |
| `border-line-2` | Borda forte |
| `shadow-1` | Card em repouso |
| `shadow-2` | Hover interativo |
| `shadow-3` | Dialog, popover, toast |

**PROIBIDO**: `bg-yellow-500`, `text-gray-600`, `border-slate-200` ou qualquer cor crua do Tailwind. Se precisar de um tom novo, adicione em `index.css` + `tailwind.config.ts`.

---

## Tipografia

### Fontes
| Class | Font | Uso |
|---|---|---|
| `font-sans` | Space Grotesk | Todo o UI |
| `font-mono` | JetBrains Mono | Números, eyebrows, labels, dados |
| `font-serif` | Instrument Serif | SOMENTE frase itálica na tela de auth |

### Regra de ouro: números SEMPRE em mono
```html
<!-- CERTO -->
<span className="font-mono tabular-nums">2200</span>

<!-- ERRADO -->
<span>2200</span>
```

Todo número visível (kcal, gramas, %, datas, horários, contadores) usa `font-mono` + `tabular-nums`.

### Eyebrows / micro-labels
```
font-mono uppercase text-[11px] font-medium tracking-[0.08em] text-muted
```

### Escala de tipo
| Uso | Tamanho | Peso |
|---|---|---|
| Título de página (h1) | `text-[32px]` | 700 |
| Título de card (h2) | `text-[22px]` | 600 |
| Seção inline (h3) | `text-base` (16px) | 600 |
| Body | `text-sm` (14px) | 400 |
| Small/secondary | `text-[13px]` | 400 |
| Meta (mono) | `text-[11.5px]` | 500 |
| Eyebrow (mono upper) | `text-[11px]` | 500 |

---

## Espaçamento

Grid de **4px**. Valores comuns: `4, 6, 8, 10, 12, 14, 16, 20, 22, 24, 28, 32, 40, 56, 80`.

- Gap entre seções de página: `gap-7` (28px)
- Padding de card padrão: `p-[22px]`
- Padding de card compacto: `p-4` (16px)

---

## Border radii

| Token Tailwind | Valor | Uso |
|---|---|---|
| `rounded-sm` | 6px | Badges, chips pequenos |
| `rounded` / `rounded-md` | 10px | Botões, inputs, selects |
| `rounded-lg` | 14px | Cards, dialogs |
| `rounded-xl` | 22px | Raro (bezel) |
| `rounded-full` | 999px | Badges de status |

---

## Motion

- Hover: transicione apenas as propriedades alteradas, por exemplo `transition-[background,color] duration-120`
- Press: `active:translate-y-[0.5px]`
- Dialog enter: `animate-fade-in` (150ms)
- Toast: `animate-toast-in` (180ms)
- Drawer: `animate-slide-in` (180ms)

**Sem** bounce, spring, framer-motion. Motion é funcional, não decorativa.

---

## Dark mode

Tokens já têm valores `.dark` em `index.css`. **Nunca** use `dark:bg-xxx` manualmente — escreva no token semântico e ele funciona automaticamente.
