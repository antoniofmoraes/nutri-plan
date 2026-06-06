# NutriPlan — Diretivas para Claude Code

Documento de referência que o Claude **deve ler e seguir** ao operar neste repositório. Mantenha curto, denso e atualizado conforme padrões evoluírem.

---

## 1. Visão geral

App full-stack de planejamento alimentar (planos semanais, refeições, alimentos TBCA, listas de compras compartilháveis, refeições preset).

- **Monorepo simples** em `apps/`: nada de turborepo/nx — apenas duas pastas.
- **Idioma**: UI, mensagens de erro, commits e domínio em **português**. Código (identificadores, tipos, comentários quando existirem) em **inglês**.
- **Deploy**: Coolify aponta para `docker-compose.yml` (produção). Local usa `docker-compose.local.yml`.
- **AI Specs**: `docs/ai-specs/` contém especificações compactas do redesign PORTIO (tokens, componentes, telas, backend, guard-rails). **Leia `docs/ai-specs/guard-rails.md` antes de qualquer mudança de UI ou backend.**
- **Design Handoff**: `docs/design-handoff/` contém o protótipo interativo de referência (`reference/index.html`). Abra no browser para source of truth visual.

```
apps/
  NutriPlan.Api/   → backend .NET 10 (Minimal APIs + EF Core + PostgreSQL)
  web-app/         → frontend React 18 + Vite + TS + shadcn/ui + Tailwind
docs/
  ai-specs/        → specs do redesign PORTIO para consumo por IAs
  design-handoff/  → protótipo interativo + spec original do redesign
```

---

## 2. Stack consolidada (não troque sem motivo)

| Camada       | Escolhas                                                                       |
| ------------ | ------------------------------------------------------------------------------ |
| Backend      | .NET 10, Minimal APIs (sem MVC Controllers), EF Core + Npgsql, JWT + BCrypt    |
| Frontend     | React 18, Vite + SWC, TypeScript estrito, React Router v6                      |
| UI           | shadcn/ui (Radix), Tailwind 3 com CSS variables HSL, lucide-react              |
| Estado       | Context API + `useState` para domínio; TanStack Query disponível mas opcional  |
| Forms        | react-hook-form + zod                                                          |
| Datas        | date-fns                                                                       |
| Notificações | sonner (`toast`) — preferir sobre o `useToast` do shadcn                       |
| Banco        | PostgreSQL (Supabase ou similar); migrations automáticas no startup            |
| Infra        | Docker multi-stage; nginx serve o frontend e proxy `/api` → api:3000           |
| Mobile       | Capacitor 7 — wraps o web-app em APK/IPA nativo; Android + iOS                |

---

## 3. Backend — diretivas

### 3.1 Arquitetura: simples, sem cerimônia

- **Sem Controllers, sem Repositories, sem MediatR, sem AutoMapper.** Mantenha o padrão Minimal API + Service injetado.
- Endpoint → `Service` (DI scoped) → `AppDbContext`. Ponto.
- Use **primary constructors** em services: `public class FooService(AppDbContext db) { ... }`.
- DTOs como `record` (positional). Modelos como classes EF.
- Mantenha `Program.cs` como **única fonte de roteamento** — agrupe com `MapGroup` por recurso (`/api/meal-plans`, etc.).

### 3.2 Padrões obrigatórios

- **Erros de domínio**: lance `throw new ApiException("mensagem em PT", statusCode)`. O `ExceptionMiddleware` converte para `ApiResponse(false, error)`. Nunca devolva 500 manualmente.
- **Respostas**: sempre via `ApiResponses.Ok(data)` / `ApiResponses.Error(...)`. O envelope `{ success, data, error, message, details }` é contrato com o frontend — não quebre.
- **Auth**: `.RequireAuthorization()` no `MapGroup`. Extraia o usuário via `GetUserId(ctx)` (helper em `Program.cs`). Todo serviço que tem dados de usuário **deve receber `userId` e validar ownership** (`if (entity.UserId != userId) throw new ApiException("Acesso negado", 403)`).
- **EF Core**:
  - Use `Include` explícito; nada de lazy loading.
  - Para grafos repetidos, extraia um `IQueryable<T> GetXQuery()` privado (ver `MealPlanService.GetPlansQuery()`).
  - `SaveChangesAsync` — nunca `SaveChanges` síncrono.
  - Timestamps são preenchidos automaticamente no `AppDbContext.UpdateTimestamps()`.
- **Migrations**: `dotnet ef migrations add <Nome>` a partir de `apps/NutriPlan.Api`. Rodam automaticamente no boot (`db.Database.MigrateAsync()`).
- **Configuração**: env vars sobrescrevem `appsettings`. Nomes esperados: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`, `PORT`.

### 3.3 Eficiência sem overengineering

- **Não adicione** abstrações para um caso só (Repository por entidade, Generic CRUD, IUnitOfWork, Result<T> pattern). O `ApiException` já cobre os fluxos de erro.
- **Não introduza** AutoMapper. Mapeamentos manuais são triviais com records e fica óbvio o que sai na resposta (`MealPlanService.ToResponse` é o exemplo a seguir).
- **Não pague o custo de async streams / IAsyncEnumerable** sem precisar — `ToListAsync()` está ótimo nas escalas atuais.
- **N+1**: ao tocar um service, verifique includes; prefira projeção (`.Select` para DTO) quando estiver buscando muitos dados só para serializar.
- **Validação**: zod já valida no frontend. No backend, valide **invariantes de negócio** (ownership, unicidade, formato de email). Não duplique validação trivial — confie no contrato dos DTOs.

### 3.4 Quando criar um novo recurso

1. `Models/Foo.cs` — entidade EF (POCO).
2. Atualize `AppDbContext` (DbSet + `OnModelCreating` se houver índice/relacionamento).
3. `dotnet ef migrations add AddFoo`.
4. `DTOs/FooDtos.cs` — `record CreateFooRequest`, `FooResponse`, etc.
5. `Services/FooService.cs` — primary constructor + métodos `async`.
6. Registre em `Program.cs` (`AddScoped<FooService>()`).
7. `MapGroup("/api/foos").RequireAuthorization()` + endpoints CRUD.
8. No frontend: `services/fooService.ts` + adicione no `MealPlanContext` (ou crie context próprio se for domínio independente).

---

## 4. Frontend — diretivas gerais

### 4.1 Organização

```
src/
  components/
    ui/          → shadcn/ui (não editar manualmente — usar `npx shadcn add`)
    layout/      → MainLayout, Sidebar
    dashboard/   → componentes específicos de feature
  contexts/      → estado de domínio (Auth, MealPlan)
  hooks/         → hooks customizados (use-mobile, use-toast)
  lib/           → api client, utils (cn, etc.)
  pages/         → uma página por rota (App.tsx amarra tudo)
  services/      → wrappers de API por recurso
  types/         → tipos compartilhados de domínio
```

- **Alias `@/`** está configurado (`vite.config.ts` + `tsconfig`). Use sempre `@/components/...`, nunca caminhos relativos longos.
- **Componentes de feature**: agrupe em subpasta de `components/<feature>/`. Quando um componente passa de ~200 linhas ou é reutilizado, **extraia**.
- **Páginas grandes** (PlanDetail, PresetMeals — hoje 20k+) **devem ser quebradas** ao tocá-las. Aceitável >300 linhas; alarme >500.

### 4.2 Comunicação com API

- Use **`api.get/post/patch/delete`** de `@/lib/api.ts`. Ele já cuida de JWT, envelope `ApiResponse`, e converte erro em `ApiError` com `statusCode` e `details`.
- **Camada `services/`** transforma `ApiX` (formato wire) → tipos de domínio (`@/types`). Não faça `fetch` direto na página.
- **Estado de servidor**:
  - **Default atual**: `MealPlanContext` carrega tudo em memória e expõe operações. Mantenha esse padrão para o domínio existente.
  - **Para novos recursos com paginação/cache não trivial**: use **TanStack Query** (já está no provider, é só usar). Não misture os dois para o mesmo recurso.
- **Erros**: capture `ApiError` e mostre via `toast.error(err.message)`. Nunca renderize erro técnico cru ao usuário.

### 4.3 Forms

- Sempre **react-hook-form + zod** para forms com mais de 2 campos.
- Schemas zod em PT-BR nas mensagens (`z.string().min(1, "Nome obrigatório")`).
- Use os componentes `<Form>...<FormField>` do shadcn — eles já integram com hook-form.

### 4.4 Loading & Empty states

- **Não retorne `null`** silencioso enquanto carrega. Use skeleton do shadcn (`@/components/ui/skeleton`) ou um spinner discreto.
- **Sempre forneça empty state** com call-to-action (ver Dashboard "Nenhum plano alimentar" como referência). Padrão visual: card centralizado + ícone em círculo `bg-primary/10` + título + descrição + botão.

---

## 5. Design system

### 5.1 Tokens (NÃO use cores hex/Tailwind crus)

Todas as cores estão em `src/index.css` como **CSS variables HSL** e expostas via `tailwind.config.ts`. **Sempre** use os tokens semânticos:

| Categoria   | Tokens                                                                       |
| ----------- | ---------------------------------------------------------------------------- |
| Superfícies | `bg-background`, `bg-card`, `bg-popover`, `bg-muted`, `bg-sidebar`           |
| Texto       | `text-foreground`, `text-muted-foreground`, `text-card-foreground`           |
| Ações       | `bg-primary`, `bg-accent`, `bg-destructive` (sempre com `*-foreground` par)  |
| Status      | `text-success`, `text-warning`, `text-info`, `text-destructive`              |
| Macros      | `text-protein`, `text-carbs`, `text-fat` (e `bg-*` equivalentes)             |
| Bordas      | `border-border`, `border-input`, `ring-ring`                                 |
| Sombras     | `shadow-soft`, `shadow-medium`, `shadow-strong`, `shadow-glow`               |

**Banido**: `bg-yellow-500`, `text-gray-600`, `border-slate-200` etc. Se faltar um tom, adicione um token novo em `index.css` + `tailwind.config.ts` em vez de hardcode.

### 5.2 Tipografia

- Body: `font-sans` (Inter, já default no body).
- Títulos h1-h6: `font-display` (Nunito) — aplicado automaticamente no `index.css`. Em headings dentro de componentes, repita `font-display` se quiser garantir.
- Escala recomendada: `text-3xl` (page title), `text-xl` (section title), `text-lg` (card title), `text-sm` (meta), `text-xs` (chips/labels).

### 5.3 Espaçamento, raios e elevação

- **Raios**: use `rounded-lg` (padrão), `rounded-xl`, `rounded-2xl` para cards grandes. `rounded-full` para avatares/chips.
- **Cards de conteúdo**: `rounded-2xl bg-card p-6 shadow-medium`.
- **Container**: `MainLayout` já provê `container max-w-6xl`. Não envolva páginas em containers extras.
- **Gap padrão de seção**: `space-y-6` ou `space-y-8`.

### 5.4 Animações

- Use as classes existentes (`animate-fade-in`, `animate-slide-in`, `animate-pulse-soft`, `animate-float`) — montagem de página típica: `<div className="animate-fade-in space-y-8">`.
- Transições de hover: `transition-all duration-200` (consistente com Sidebar).
- Não adicione bibliotecas de animação (framer-motion etc.) sem necessidade real.

### 5.5 Dark mode

- Tokens já têm valores `.dark`. Sempre escreva no token, nunca trate dark mode manualmente com `dark:`.
- `next-themes` está instalado mas o toggle ainda não foi exposto — quando implementar, colocar no `Sidebar` (user section).

---

## 6. Desenvolvimento híbrido desktop ↔ mobile

Prioridade central deste projeto. Toda nova UI deve passar nos dois cenários **antes de marcar como pronta**.

### 6.1 Breakpoints (Tailwind padrão + nosso hook)

| Prefixo | Largura  | Uso                                            |
| ------- | -------- | ---------------------------------------------- |
| (none)  | < 640px  | **Mobile** (design base)                       |
| `sm:`   | ≥ 640px  | Phablet / mobile landscape                     |
| `md:`   | ≥ 768px  | Tablet — limiar do `useIsMobile()` hook        |
| `lg:`   | ≥ 1024px | Desktop — sidebar fixa aparece aqui            |
| `xl:`   | ≥ 1280px | Desktop grande                                 |

**Hook**: `useIsMobile()` em `@/hooks/use-mobile` retorna `true` abaixo de 768px. Use **apenas** para lógica JS (ex: render condicional de drawer vs. dialog). Para layout, **sempre prefira classes responsivas Tailwind** — elas funcionam sem hidratação.

### 6.2 Regras de ouro (mobile-first)

1. **Escreva mobile primeiro, escale para cima.** `flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between` — nunca `flex-row sm:flex-col`.
2. **Toque ≥ 44px de alvo.** Botões de ícone usam `size="icon"` (40px) — em mobile, prefira `size="default"` (44px+) para ações principais.
3. **Tabelas viram cards em mobile.** Não tente fazer tabela horizontal scrollar — converta em lista de cards abaixo de `md:`.
4. **Diálogos viram drawers em mobile.** Use `vaul` (já instalado) ou o componente `Drawer` do shadcn para forms longos. Modais `Dialog` ok para confirmações curtas.
5. **Sidebar é drawer em mobile.** Padrão já implementado em `components/layout/Sidebar.tsx` (overlay + transform). Replicar para qualquer nav lateral nova.
6. **Texto responsivo**: `text-xs sm:text-sm`, `text-2xl sm:text-3xl`. Nunca deixe texto pequeno demais em mobile (mínimo `text-sm` para leitura).
7. **Grids**: `grid gap-4 sm:grid-cols-2 lg:grid-cols-4` (ver MacroCards). Nunca mais de 2 colunas em mobile.
8. **Ações primárias no rodapé/topo fixo em mobile.** Em desktop podem ficar inline. Pattern: `<div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t lg:static lg:border-0 lg:p-0">`.
9. **Imagens**: sempre `max-w-full h-auto`. Para hero/avatar use `aspect-square` ou `aspect-video`.
10. **Inputs numéricos**: já removemos spinners (`index.css`). Em mobile use `inputMode="decimal"` e `pattern="[0-9]*"` para teclado correto.

### 6.3 Checklist antes de "pronto"

- [ ] Funciona em 375px (iPhone SE) sem scroll horizontal.
- [ ] Funciona em 1440px (laptop) sem texto/cards esticarem absurdamente (respeita `max-w-6xl`).
- [ ] Sidebar/nav é alcançável em mobile (drawer abre).
- [ ] Não há `overflow-x-hidden` mascarando layout quebrado — investigue a causa.
- [ ] Botão de ação principal visível **sem scroll** em mobile.
- [ ] Loading e empty states implementados.
- [ ] Tokens semânticos (sem cores cruas).

### 6.4 Mobile nativo — Capacitor

Estratégia escolhida: **Capacitor** wrapa o web-app existente em shell nativo (Android APK/AAB + iOS IPA), sem reescrever componentes. Fluxo:

```
npm run build  →  npx cap sync  →  Gradle (Android) / Xcode (iOS)
```

**Setup (uma vez por plataforma):**
```bash
# na pasta apps/web-app
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init NutriPlan com.nutriplan.app --web-dir dist
npx cap add android
npx cap add ios          # requer macOS
```

**Arquivos-chave:**
- `apps/web-app/capacitor.config.ts` — configuração do app (appId, server URL).
- `apps/web-app/android/` — projeto Gradle gerado; **não editar manualmente** exceto `app/src/main/res/` (ícones, splash).
- `apps/web-app/ios/` — projeto Xcode gerado; mesma regra.

**Fluxo de desenvolvimento:**
```bash
npm run build && npx cap sync android   # atualiza WebView com o build mais recente
npx cap open android                    # abre Android Studio (só para debug/emulador)
npx cap open ios                        # abre Xcode
```

**Regras:**
- O `capacitor.config.ts` define `server.url` em dev (aponta para a API local). Em produção, remover `server` para usar o bundle estático.
- Plugins nativos (`@capacitor/push-notifications`, `@capacitor/camera`, etc.): só adicionar quando houver requisito real — cada plugin aumenta o APK.
- **Não commitar** `android/` e `ios/` inteiros — apenas `capacitor.config.ts` e os arquivos customizados (`res/`, `Info.plist`). Deixar no `.gitignore` o que o Gradle/Xcode gera (`.gradle/`, `build/`, `Pods/`, etc.).

**PWA (complementar):** Quando implementar, usar `vite-plugin-pwa`. Estratégia: `NetworkFirst` para `/api`, `CacheFirst` para assets. Não substitui o Capacitor — serve para usuários que não instalam o app nativo.

---

## 7. Testes

- **Stack**: Vitest + Testing Library (`@testing-library/react`) já configurada (`vitest.config.ts`).
- **Política realista**: não exigimos cobertura. Mas:
  - **Sempre** teste utilitários puros (`calculateMealMacros`, `calculatePlanMacros`, parsers).
  - Teste comportamento de componentes complexos que tomam decisões (Dashboard, PlanDetail).
  - Não escreva teste para componente que só renderiza props — é ruído.
- **Backend**: não há suite ainda. Quando adicionar, usar `Microsoft.AspNetCore.Mvc.Testing` + `WebApplicationFactory` com Postgres descartável (Testcontainers). Não mocar `DbContext`.
- **Antes de marcar tarefa de UI como concluída**: rode `bun run dev` (ou `npm run dev`) e teste o fluxo no navegador. Type-check e lint não substituem teste manual de UI.

---

## 8. Comandos úteis

```bash
# Backend (na pasta apps/NutriPlan.Api)
dotnet run                              # roda em :3000
dotnet ef migrations add <Nome>         # nova migration
dotnet ef database update               # aplica (geralmente desnecessário — auto no boot)
dotnet build                            # compile check

# Frontend (na pasta apps/web-app)
npm run dev                             # vite em :8080 com proxy /api → :3000
npm run build                           # build produção
npm run lint                            # eslint
npm test                                # vitest run

# Full stack (raiz)
docker compose -f docker-compose.local.yml up --build --watch

# Mobile — Capacitor (na pasta apps/web-app)
npm run build && npx cap sync android   # sincroniza build → Android
npm run build && npx cap sync ios       # sincroniza build → iOS (requer macOS)
npx cap open android                    # abre Android Studio
npx cap open ios                        # abre Xcode
npx cap run android                     # roda em dispositivo/emulador conectado
```

---

## 9. CI/CD com Coolify

Atualmente o deploy é **push-based**: Coolify observa o repo, faz `git pull` no branch configurado e executa `docker compose up --build` com `docker-compose.yml`.

### 9.1 O que já está pronto

- Multi-stage Dockerfiles otimizados (build + runtime separados).
- nginx serve SPA + proxy `/api`.
- Healthcheck: `GET /` e `/health` no backend.
- Env vars injetadas pelo Coolify (`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `VITE_API_URL`).

### 9.2 Pipeline GitHub Actions

CI vive em `.github/workflows/ci.yml`. Dois jobs paralelos (`api` e `web`), ambos com cache. Triggers: `pull_request` (qualquer alvo) + `push` em `main`/`dev`.

```yaml
name: ci

on:
  pull_request:
  push:
    branches: [main, dev]

jobs:
  api:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/NutriPlan.Api
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '10.0.x'
      - name: Cache NuGet packages
        uses: actions/cache@v4
        with:
          path: ~/.nuget/packages
          key: ${{ runner.os }}-nuget-${{ hashFiles('apps/NutriPlan.Api/**/*.csproj') }}
          restore-keys: |
            ${{ runner.os }}-nuget-
      - run: dotnet restore
      - run: dotnet build --no-restore -c Release
      # - run: dotnet test --no-build -c Release (quando houver testes)

  web:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/web-app
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: apps/web-app/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

Notas:
- **.NET 10 está GA** — não precisa de `include-prerelease`.
- **Cache NuGet** usa hash dos `.csproj`. Para chave mais precisa, ativar `RestorePackagesWithLockFile` e cachear por `packages.lock.json`.
- **Cache npm** é o nativo do `setup-node` (mais correto que cachear `node_modules` direto).

**Diretivas**:
- CI **bloqueia merge em `main`** apenas se quebrar build/test/lint. Não adicionar gates pesados (coverage threshold, SAST, etc.) sem combinar.
- Coolify segue independente — CI valida; Coolify deploya. Não tentar deploy via Actions sem motivo.
- Para preview environments: Coolify suporta — configurar por branch quando o projeto crescer.

### 9.3 Pipeline de mobile (Capacitor)

CI vive em `.github/workflows/mobile.yml`. Separado do `ci.yml` porque só roda em push para `main` ou manualmente — não bloqueia PRs.

**Android** (`ubuntu-latest`, gratuito):
- Build web → `cap sync` → `./gradlew bundleRelease` (AAB para Play Store) ou `assembleDebug` (APK de teste).
- Signing para release: secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
- Artifact: APK/AAB enviado como `actions/upload-artifact`.

**iOS** (`macos-latest`, ~10× mais caro em minutos):
- Requer Apple Developer Program ativo.
- Usar **fastlane match** para gerenciar certificados/provisioning profiles via Git (repo privado de certs).
- Build: `xcodebuild archive` + `xcodebuild -exportArchive` → `.ipa`.
- Secrets: `MATCH_PASSWORD`, `APPLE_ID`, `APP_STORE_CONNECT_API_KEY_*`.
- **Recomendação**: implementar iOS CI quando o app estiver próximo de submissão à App Store; até lá, build local via Xcode.

**Diretivas:**
- Não rodar mobile CI em PRs — é lento e não bloqueia nada funcional.
- AAB de release só é gerado em push para `main` (com secrets de signing configurados).
- Debug APK pode ser gerado sempre — útil para distribuição interna via Firebase App Distribution ou similar.

### 9.5 Branches

- `main` → produção (Coolify aponta aqui).
- `dev` → branch de integração diária (branch atual de trabalho).
- Features: `feat/*`, fixes: `fix/*`. PR para `dev`, merge de `dev` para `main` em "release".

---

## 10. Segurança — checklist mínimo

- [ ] Endpoint novo tem `.RequireAuthorization()`? (a menos que seja público intencional).
- [ ] Service valida `ownership` (`UserId == userId`)?
- [ ] Sem segredo em log, em commit, ou em frontend (`VITE_*` é público).
- [ ] Inputs do usuário nunca concatenados em SQL — use EF/parâmetros sempre.
- [ ] `JWT_SECRET` é forte em produção (Coolify env, ≥ 32 bytes).
- [ ] CORS em produção: `CORS_ORIGIN` setado para domínio(s) reais, **nunca `*`**.
- [ ] BCrypt para senhas (já é o padrão — não troque por SHA/MD5).

---

## 11. Anti-overengineering — princípios duros

- **Adicione abstração só na 3ª duplicação**, não na 2ª.
- **Não invente camadas** "para o futuro" (Repository, UseCase, IService interface, Generic Controller). Se um dia precisar, refatora.
- **Não troque libs estáveis** (axios em vez de fetch+wrapper, Redux em vez de Context). O custo é maior que o ganho.
- **Não escreva docstring/comment** explicando **o que** o código faz — só **por que** quando não é óbvio.
- **Bug fix é bug fix** — não aproveite para refatorar arquivos vizinhos no mesmo PR.
- **Feature flag/config dinâmica**: só quando há requisito real de toggle em runtime. Caso contrário, é código novo direto.

---

## 12. Quando estiver em dúvida

1. Veja como features parecidas foram feitas (procure por `MealPlan*` como referência canônica de full vertical).
2. Pergunte ao usuário em vez de inventar — especialmente sobre UX híbrida e decisões de produto.
3. Não adicione dependência nova sem confirmar (especialmente frontend — `package.json` já está pesado).
4. Prefira **deletar código** a adicionar quando algo está confuso.
