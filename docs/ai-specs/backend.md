# Backend — PORTIO

> Stack: .NET 10, Minimal APIs, EF Core + Npgsql, JWT + BCrypt
> Código em: `apps/NutriPlan.Api/`

---

## Arquitetura (3 camadas, sem cerimônia)

```
Endpoint (Program.cs) → Service (DI scoped) → AppDbContext
```

**Não existe e não deve existir**: Controllers, Repositories, MediatR, AutoMapper, IUnitOfWork, Generic CRUD, Result<T>.

---

## Checklist para novo recurso

1. `Models/Foo.cs` — entidade EF (POCO)
2. `AppDbContext` — DbSet + `OnModelCreating` se necessário
3. `dotnet ef migrations add AddFoo`
4. `DTOs/FooDtos.cs` — records posicionais (`record CreateFooRequest(...)`)
5. `Services/FooService.cs` — primary constructor: `public class FooService(AppDbContext db)`
6. `Program.cs` — `AddScoped<FooService>()` + `MapGroup("/api/foos").RequireAuthorization()`
7. Frontend: `services/fooService.ts`

---

## Padrões obrigatórios

### Erros
```csharp
throw new ApiException("Mensagem em PT", 404);
// ExceptionMiddleware converte → ApiResponse(false, error)
```

### Respostas
```csharp
ApiResponses.Ok(data)   // { success: true, data }
ApiResponses.Error(msg) // { success: false, error }
```
Envelope `{ success, data, error, message, details }` é contrato — não quebre.

### Auth
```csharp
.RequireAuthorization() // no MapGroup
var userId = GetUserId(ctx); // helper em Program.cs
// Todo service VALIDA ownership:
if (entity.UserId != userId) throw new ApiException("Acesso negado", 403);
```

### EF Core
- `Include` explícito (sem lazy loading)
- `SaveChangesAsync` (nunca síncrono)
- Grafos repetidos → `IQueryable<T> GetXQuery()` privado
- Timestamps: `AppDbContext.UpdateTimestamps()` automático
- Migrations rodam no boot (`db.Database.MigrateAsync()`)

### Validação
- Backend valida **invariantes de negócio** (ownership, unicidade, formato email)
- Validação trivial fica no frontend (zod) — não duplicar

---

## Integração MCP — descoberta OAuth

O servidor MCP fica em `POST /api/mcp` (JSON-RPC), autenticado por OAuth 2.1 com PKCE S256 e Dynamic Client Registration. Duas armadilhas de infraestrutura:

- **As rotas de descoberta vivem na raiz do domínio**, não em `/api` — `/.well-known/oauth-authorization-server`, `/.well-known/openid-configuration` e `/.well-known/oauth-protected-resource[/...]` (RFC 8414 e RFC 9728). O `nginx.conf` precisa de um `location` próprio para elas; sem isso caem no fallback do SPA e devolvem HTML, e nenhum cliente MCP consegue se conectar. O padrão é restrito para não capturar `/.well-known/acme-challenge/`.
- **Defina `PUBLIC_BASE_URL`** (repassada em `docker-compose.yml`). É a origem usada para montar as URLs de descoberta e o header `WWW-Authenticate` do 401. Sem ela o backend adivinha por `X-Forwarded-Proto`/`X-Forwarded-Host`; atrás do proxy do Coolify o `$scheme` do nginx é `http`, e o cliente recusa uma origem `http://`.

---

## Undo por snapshot

Mutações de alimento, plano e refeição são reversíveis. O mecanismo é único para todos os domínios.

- O service captura o estado **antes** de mutar (`UndoService.CaptureXAsync`), grava e depois chama `RecordAsync(userId, before)`.
- `RecordAsync` recaptura o estado **depois** e guarda a impressão dele (`fingerprint`, SHA-256 do JSON canônico) na linha de `undo_entries`, junto do snapshot anterior em `jsonb`.
- O envelope `ApiResponse` carrega `undoToken`. O endpoint lê de `UndoService.LastToken` (o service é scoped, um por requisição).
- `POST /api/undo/{token}` valida dono, expiração (5 min) e consumo, recalcula a impressão do estado atual e **rejeita com 409 se algo mais novo tocou o escopo**. A restauração roda em transação.
- Reinserção usa os **ids originais** — as PKs são `Guid` geradas na aplicação, não identity. Nunca recrie entidade excluída com id novo: quebra referências.
- Operação composta é uma chamada só, para o snapshot cobrir o conjunto inteiro.

**Fora do undo**: excluir alimento do catálogo (`DELETE /api/foods/{id}`). O cascade atinge `meal_foods` e `preset_meal_foods` de todos os usuários, então restaurar reescreveria dados de terceiros. A confirmação na UI declara esse efeito.

Ao adicionar uma mutação nesses domínios, capture antes, registre depois e devolva `undo.LastToken` no envelope.

---

## Config

Env vars sobrescrevem `appsettings`:

| Var | Uso |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL |
| `JWT_SECRET` | Chave JWT (≥32 bytes em prod) |
| `JWT_EXPIRES_IN` | Expiração do token |
| `CORS_ORIGIN` | Domínios permitidos (nunca `*` em prod) |
| `PORT` | Porta do servidor |

---

## Segurança — checklist

- [ ] Endpoint novo tem `.RequireAuthorization()`?
- [ ] Service valida ownership (`UserId == userId`)?
- [ ] Sem segredo em log, commit ou frontend
- [ ] Inputs nunca concatenados em SQL — use EF/parâmetros
- [ ] BCrypt para senhas (não troque)
