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
