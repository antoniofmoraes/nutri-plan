# PORTIO (NutriPlan)

App full-stack de planejamento alimentar: planos semanais de refeições, catálogo de alimentos (TBCA), macros por dia/refeição, refeições prontas reutilizáveis, listas de compras compartilháveis e exportação (Markdown/Word/PDF).

## Stack

| Camada   | Tecnologia                                                        |
| -------- | ----------------------------------------------------------------- |
| Backend  | .NET 10 · Minimal APIs · EF Core + Npgsql · JWT + BCrypt           |
| Frontend | React 18 · Vite + SWC · TypeScript · TanStack Query · Tailwind 3   |
| UI       | shadcn/ui (Radix) · design system PORTIO · lucide-react            |
| Banco    | PostgreSQL (Supabase) — migrations automáticas no boot             |
| Mobile   | Capacitor 8 (Android; iOS planejado)                               |
| Deploy   | Coolify + Docker Compose · nginx serve a SPA e faz proxy de `/api` |

## Estrutura

```
apps/
  NutriPlan.Api/   → backend .NET 10 (Minimal APIs + EF Core + PostgreSQL)
  web-app/         → frontend React + Vite (+ projeto Android do Capacitor)
docs/
  ai-specs/        → specs compactas do design system PORTIO e guard-rails
  design-handoff/  → protótipo interativo de referência visual
```

## Rodando localmente

### Pré-requisitos

- .NET SDK 10
- Node.js 20+
- PostgreSQL acessível (ou use o Docker Compose abaixo)

### Backend

```bash
cd apps/NutriPlan.Api
# configure apps/NutriPlan.Api/appsettings.Development.json a partir do .example
dotnet run        # API em http://localhost:3000 (migrations rodam no boot)
```

Variáveis esperadas (env vars sobrescrevem appsettings): `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`, `PORT`.

### Frontend

```bash
cd apps/web-app
npm install
npm run dev       # Vite em http://localhost:8080 com proxy /api → :3000
```

### Full stack via Docker

```bash
docker compose -f docker-compose.local.yml up --build --watch
```

## Qualidade

```bash
# Frontend (apps/web-app)
npm run lint      # eslint — CI falha com erro de lint
npm test          # vitest
npm run build     # build de produção

# Backend (apps/NutriPlan.Api)
dotnet build
```

## Mobile (Capacitor)

```bash
cd apps/web-app
npm run build && npx cap sync android   # sincroniza o build com o projeto Android
npx cap open android                    # abre no Android Studio
npx cap run android                     # roda em dispositivo/emulador
```

O CI (`.github/workflows/mobile.yml`) gera um APK de debug em push para `main`.

## Branches e deploy

- `main` → produção (Coolify observa e faz deploy via `docker-compose.yml`).
- `dev` → integração diária.
- Features em `feat/*`, fixes em `fix/*`; PR para `dev`, release = merge `dev` → `main`.

## Documentação

- [CLAUDE.md](CLAUDE.md) — convenções de código e diretivas do repositório.
- [docs/ai-specs/](docs/ai-specs/) — design tokens, componentes, telas, backend e guard-rails do PORTIO.
- [docs/design-handoff/](docs/design-handoff/) — protótipo de referência (abra `reference/index.html` no browser).
