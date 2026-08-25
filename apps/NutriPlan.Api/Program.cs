using System.Text;
using System.Text.RegularExpressions;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NutriPlan.Api.Data;
using NutriPlan.Api.DTOs;
using NutriPlan.Api.Middleware;
using NutriPlan.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Configuration: env vars override appsettings
builder.Configuration.AddEnvironmentVariables();

// Database — Npgsql requires key-value format, not postgresql:// URIs
var databaseUrl = builder.Configuration["DATABASE_URL"]
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("DATABASE_URL is required");

var connectionString = databaseUrl;
var dbMatch = Regex.Match(databaseUrl, @"^postgres(?:ql)?://([^:]+):(.+)@([^:/@]+):(\d+)/(.+)$");
if (dbMatch.Success)
{
    // Resolve hostname to IPv4 to avoid Docker IPv6 routing issues
    var host = dbMatch.Groups[3].Value;
    try
    {
        var ipv4Addresses = System.Net.Dns.GetHostAddresses(host, System.Net.Sockets.AddressFamily.InterNetwork);
        if (ipv4Addresses.Length > 0)
            host = ipv4Addresses[0].ToString();
    }
    catch (Exception ex) { Console.Error.WriteLine($"DNS IPv4 resolution failed for {host}, using original hostname: {ex.Message}"); }
    connectionString = $"Host={host};Port={dbMatch.Groups[4].Value};Database={dbMatch.Groups[5].Value};Username={dbMatch.Groups[1].Value};Password={dbMatch.Groups[2].Value};SSL Mode=Require;Trust Server Certificate=true";
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// JWT Authentication — exige JWT_SECRET em produção (fail-fast para evitar
// o fallback inseguro que aceitaria tokens forjados).
var jwtSecret = builder.Configuration["JWT_SECRET"]
    ?? builder.Configuration["Jwt:Secret"];

if (string.IsNullOrWhiteSpace(jwtSecret))
{
    if (!builder.Environment.IsDevelopment())
        throw new InvalidOperationException("JWT_SECRET é obrigatório em produção");
    jwtSecret = "dev-only-secret-do-not-use-in-prod-please-replace-32b";
}
if (!builder.Environment.IsDevelopment() && Encoding.UTF8.GetByteCount(jwtSecret) < 32)
    throw new InvalidOperationException("JWT_SECRET deve ter pelo menos 32 bytes em produção");

var jwtIssuer = builder.Configuration["JWT_ISSUER"] ?? "nutriplan-api";
var jwtAudience = builder.Configuration["JWT_AUDIENCE"] ?? "nutriplan-app";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var authHeader = context.Request.Headers.Authorization.ToString();
                if (context.Request.Path.StartsWithSegments("/api/mcp")
                    && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                    && authHeader["Bearer ".Length..].Count(c => c == '.') != 2)
                {
                    context.NoResult();
                }

                return Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                return context.Response.WriteAsJsonAsync(new ApiResponse(false, Error: "Token não fornecido"));
            },
            OnAuthenticationFailed = context =>
            {
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                return context.Response.WriteAsJsonAsync(new ApiResponse(false, Error: "Token inválido ou expirado"));
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Admin", policy =>
        policy.RequireAuthenticatedUser().RequireClaim("isAdmin", "true"));
});

// CORS — wildcard só em Development; produção exige CORS_ORIGIN explícito
var corsOrigin = builder.Configuration["CORS_ORIGIN"];
if (string.IsNullOrWhiteSpace(corsOrigin) && !builder.Environment.IsDevelopment())
    throw new InvalidOperationException("CORS_ORIGIN é obrigatório em produção");

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (string.IsNullOrWhiteSpace(corsOrigin) || corsOrigin.Trim() == "*")
        {
            policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
        }
        else
        {
            var origins = corsOrigin
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            policy.WithOrigins(origins)
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        }
    });
});

// Rate limiting — protege endpoints de auth contra brute force/enumeração
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsJsonAsync(
            new ApiResponse(false, Error: "Muitas tentativas. Tente novamente em instantes."),
            cancellationToken);
    };

    // Janela curta para login/register: 10 req/min por IP
    options.AddPolicy("auth", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});

// HTTP client for external APIs (Google userinfo etc.)
builder.Services.AddHttpClient();

// Services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<FoodService>();
builder.Services.AddScoped<UndoService>();
builder.Services.AddScoped<MealPlanService>();
builder.Services.AddScoped<MealPlanShareService>();
builder.Services.AddScoped<MealSlotService>();
builder.Services.AddScoped<MealService>();
builder.Services.AddScoped<MealFoodService>();
builder.Services.AddScoped<ShoppingListService>();
builder.Services.AddScoped<PresetMealService>();
builder.Services.AddScoped<MealPlanExportService>();
builder.Services.AddScoped<McpService>();
builder.Services.AddScoped<OAuthService>();

// JSON serialization
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

var app = builder.Build();

// Middleware
app.UseMiddleware<ExceptionMiddleware>();
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// Auto-migrate and seed
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    await DbSeeder.SeedAsync(db, builder.Configuration);
}

// Helper to extract userId from JWT claims
static Guid GetUserId(HttpContext ctx)
{
    var claim = ctx.User.FindFirst("userId")?.Value;
    return claim is not null ? Guid.Parse(claim) : throw new ApiException("Token inválido", 401);
}

// ─── Health ───────────────────────────────────────────────
static async Task<(Guid UserId, bool CanWrite)> GetMcpRequestContextAsync(HttpContext ctx, OAuthService oauthSvc)
{
    var jwtClaim = ctx.User.FindFirst("userId")?.Value;
    if (jwtClaim is not null)
        return (Guid.Parse(jwtClaim), true);

    var authHeader = ctx.Request.Headers.Authorization.ToString();
    if (!authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
    {
        ctx.Response.Headers.Append(
            "WWW-Authenticate",
            $"Bearer resource_metadata=\"{GetPublicOrigin(ctx)}/.well-known/oauth-protected-resource/api/mcp\"");
        throw new ApiException("Token nao fornecido", 401);
    }

    var token = authHeader["Bearer ".Length..].Trim();
    var validation = await oauthSvc.ValidateAccessTokenAsync(token, "mcp:read");
    return (validation.UserId, validation.Scopes.Contains("mcp:write"));
}

static string GetPublicOrigin(HttpContext ctx)
{
    var config = ctx.RequestServices.GetRequiredService<IConfiguration>();
    var configuredOrigin = config["PUBLIC_BASE_URL"] ?? config["PUBLIC_APP_URL"] ?? config["APP_PUBLIC_URL"];
    if (!string.IsNullOrWhiteSpace(configuredOrigin))
        return configuredOrigin.Trim().TrimEnd('/');

    var forwardedProto = ctx.Request.Headers["X-Forwarded-Proto"].ToString()
        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        .FirstOrDefault();
    var forwardedHost = ctx.Request.Headers["X-Forwarded-Host"].ToString()
        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        .FirstOrDefault();

    var scheme = string.IsNullOrWhiteSpace(forwardedProto) ? ctx.Request.Scheme : forwardedProto;
    var host = string.IsNullOrWhiteSpace(forwardedHost) ? ctx.Request.Host.Value : forwardedHost;

    if (ctx.Request.Headers["X-Forwarded-Ssl"].ToString().Equals("on", StringComparison.OrdinalIgnoreCase))
        scheme = "https";

    return $"{scheme}://{host}".TrimEnd('/');
}

static object GetOAuthAuthorizationServerMetadata(HttpContext ctx)
{
    var origin = GetPublicOrigin(ctx);

    return new
    {
        issuer = origin,
        authorization_endpoint = $"{origin}/oauth/authorize",
        token_endpoint = $"{origin}/api/oauth/token",
        registration_endpoint = $"{origin}/api/oauth/register",
        revocation_endpoint = $"{origin}/api/oauth/revoke",
        scopes_supported = new[] { "mcp:read", "mcp:write" },
        response_types_supported = new[] { "code" },
        grant_types_supported = new[] { "authorization_code" },
        code_challenge_methods_supported = new[] { "S256" },
        token_endpoint_auth_methods_supported = new[] { "none" },
        service_documentation = $"{origin}/integracoes-ia/instrucoes",
        protected_resources = new[] { $"{origin}/api/mcp" }
    };
}

static object GetOAuthProtectedResourceMetadata(HttpContext ctx)
{
    var origin = GetPublicOrigin(ctx);

    return new
    {
        resource = $"{origin}/api/mcp",
        resource_name = "NutriPlan MCP",
        resource_documentation = $"{origin}/integracoes-ia/instrucoes",
        authorization_servers = new[] { origin },
        scopes_supported = new[] { "mcp:read", "mcp:write" },
        bearer_methods_supported = new[] { "header" }
    };
}

app.MapGet("/", () => Results.Json(new { success = true, message = "NutriPlan API", version = "1.0.0", timestamp = DateTime.UtcNow }));
app.MapGet("/health", () => Results.Json(new { status = "ok" }));

app.MapGet("/.well-known/oauth-authorization-server", (HttpContext ctx) =>
    Results.Json(GetOAuthAuthorizationServerMetadata(ctx)));

app.MapGet("/.well-known/openid-configuration", (HttpContext ctx) =>
    Results.Json(GetOAuthAuthorizationServerMetadata(ctx)));

app.MapGet("/.well-known/oauth-protected-resource", (HttpContext ctx) =>
    Results.Json(GetOAuthProtectedResourceMetadata(ctx)));

app.MapGet("/.well-known/oauth-protected-resource/{**resourcePath}", (HttpContext ctx) =>
    Results.Json(GetOAuthProtectedResourceMetadata(ctx)));

// ─── Auth ─────────────────────────────────────────────────
var auth = app.MapGroup("/api/auth");

auth.MapPost("/register", async (RegisterRequest request, AuthService svc) =>
    Results.Json(ApiResponses.Ok(await svc.RegisterAsync(request)), statusCode: 201))
    .RequireRateLimiting("auth");

auth.MapPost("/login", async (LoginRequest request, AuthService svc) =>
    Results.Json(ApiResponses.Ok(await svc.LoginAsync(request))))
    .RequireRateLimiting("auth");

auth.MapPost("/google", async (GoogleAuthRequest request, AuthService svc) =>
    Results.Json(ApiResponses.Ok(await svc.GoogleAuthAsync(request.AccessToken))))
    .RequireRateLimiting("auth");

auth.MapPost("/google/link", async (GoogleLinkRequest request, AuthService svc) =>
    Results.Json(ApiResponses.Ok(await svc.GoogleLinkAsync(request.AccessToken, request.Password))))
    .RequireRateLimiting("auth");

auth.MapGet("/me", async (HttpContext ctx, AuthService svc) =>
    Results.Json(ApiResponses.Ok(await svc.GetMeAsync(GetUserId(ctx)))))
    .RequireAuthorization();

auth.MapPost("/logout", () =>
    Results.Json(new ApiResponse(true, Message: "Logout realizado com sucesso")))
    .RequireAuthorization();

// ─── Users ────────────────────────────────────────────────
// OAuth for AI integrations
var oauth = app.MapGroup("/api/oauth");

oauth.MapGet("/authorize/preview", async (
    string? response_type,
    string? client_id,
    string? redirect_uri,
    string? scope,
    string? state,
    string? code_challenge,
    string? code_challenge_method,
    OAuthService svc) =>
    Results.Json(ApiResponses.Ok(await svc.PreviewAuthorizeAsync(
        response_type,
        client_id,
        redirect_uri,
        scope,
        state,
        code_challenge,
        code_challenge_method))))
    .RequireAuthorization();

oauth.MapPost("/authorize/confirm", async (HttpContext ctx, OAuthAuthorizeConfirmRequest request, OAuthService svc) =>
    Results.Json(ApiResponses.Ok(await svc.ConfirmAuthorizeAsync(GetUserId(ctx), request))))
    .RequireAuthorization();

oauth.MapPost("/token", async (HttpContext ctx, OAuthService svc) =>
{
    if (!ctx.Request.HasFormContentType)
        throw new ApiException("Content-Type deve ser application/x-www-form-urlencoded", 400);

    var form = await ctx.Request.ReadFormAsync();
    return Results.Json(await svc.ExchangeCodeAsync(form));
});

oauth.MapPost("/register", async (OAuthClientRegistrationRequest request, OAuthService svc) =>
    Results.Json(await svc.RegisterClientAsync(request), statusCode: 201))
    .RequireRateLimiting("auth");

oauth.MapPost("/revoke", async (HttpContext ctx, OAuthService svc) =>
{
    if (!ctx.Request.HasFormContentType)
        throw new ApiException("Content-Type deve ser application/x-www-form-urlencoded", 400);

    var form = await ctx.Request.ReadFormAsync();
    await svc.RevokeAsync(form);
    return Results.Ok();
});

var users = app.MapGroup("/api/users").RequireAuthorization();

users.MapGet("/me", async (HttpContext ctx, UserService svc) =>
    Results.Json(ApiResponses.Ok(await svc.GetUserAsync(GetUserId(ctx)))));

users.MapPatch("/me", async (HttpContext ctx, UpdateUserRequest request, UserService svc) =>
    Results.Json(ApiResponses.Ok(await svc.UpdateUserAsync(GetUserId(ctx), request))));

users.MapPut("/me/main-plan", async (HttpContext ctx, SetMainPlanRequest request, UserService svc) =>
    Results.Json(ApiResponses.Ok(await svc.SetMainPlanAsync(GetUserId(ctx), request.PlanId))));

users.MapDelete("/me", async (HttpContext ctx, UserService svc) =>
{
    await svc.DeleteUserAsync(GetUserId(ctx));
    return Results.Json(new ApiResponse(true, Message: "Usuário excluído com sucesso"));
});

// ─── Foods ────────────────────────────────────────────────
var undo = app.MapGroup("/api/undo").RequireAuthorization();

undo.MapPost("/{token:guid}", async (Guid token, HttpContext ctx, UndoService svc) =>
    Results.Json(ApiResponses.Ok(await svc.UndoAsync(token, GetUserId(ctx)))));

// Leitura: qualquer usuário autenticado. Mutação: apenas admin (o catálogo é
// global/compartilhado — sem admin gate, qualquer user vandalizaria a base).
var foods = app.MapGroup("/api/foods").RequireAuthorization();

foods.MapGet("/", async (string? search, int? page, int? pageSize, FoodService svc) =>
    Results.Json(ApiResponses.Ok(await svc.GetAllAsync(search, page ?? 1, pageSize ?? 50))));

foods.MapGet("/{id:guid}", async (Guid id, FoodService svc) =>
    Results.Json(ApiResponses.Ok(await svc.GetByIdAsync(id))));

foods.MapPost("/", async (HttpContext ctx, CreateFoodRequest request, FoodService svc, UndoService undo) =>
    Results.Json(ApiResponses.Ok(await svc.CreateAsync(GetUserId(ctx), request), undo.LastToken), statusCode: 201))
    .RequireAuthorization("Admin");

foods.MapPatch("/{id:guid}", async (Guid id, HttpContext ctx, UpdateFoodRequest request, FoodService svc, UndoService undo) =>
    Results.Json(ApiResponses.Ok(await svc.UpdateAsync(id, GetUserId(ctx), request), undo.LastToken)))
    .RequireAuthorization("Admin");

foods.MapDelete("/{id:guid}", async (Guid id, FoodService svc) =>
{
    await svc.DeleteAsync(id);
    return Results.Json(new ApiResponse(true, Message: "Alimento excluído com sucesso"));
})
    .RequireAuthorization("Admin");

// ─── Meal Plans ───────────────────────────────────────────
var mealPlans = app.MapGroup("/api/meal-plans").RequireAuthorization();

mealPlans.MapGet("/", async (HttpContext ctx, MealPlanService svc) =>
    Results.Json(ApiResponses.Ok(await svc.GetAllByUserAsync(GetUserId(ctx)))));

mealPlans.MapGet("/{id:guid}", async (Guid id, HttpContext ctx, MealPlanService svc) =>
    Results.Json(ApiResponses.Ok(await svc.GetByIdAsync(id, GetUserId(ctx)))));

mealPlans.MapPost("/", async (HttpContext ctx, CreateMealPlanRequest request, MealPlanService svc, UndoService undo) =>
    Results.Json(ApiResponses.Ok(await svc.CreateAsync(GetUserId(ctx), request), undo.LastToken), statusCode: 201));

mealPlans.MapPatch("/{id:guid}", async (Guid id, HttpContext ctx, UpdateMealPlanRequest request, MealPlanService svc, UndoService undo) =>
    Results.Json(ApiResponses.Ok(await svc.UpdateAsync(id, GetUserId(ctx), request), undo.LastToken)));

mealPlans.MapDelete("/{id:guid}", async (Guid id, HttpContext ctx, MealPlanService svc) =>
{
    await svc.DeleteAsync(id, GetUserId(ctx));
    return Results.Json(new ApiResponse(true, Message: "Plano alimentar excluído com sucesso"));
});

mealPlans.MapGet("/{id:guid}/export", async (Guid id, HttpContext ctx, string? format, MealPlanService planSvc, MealPlanExportService exportSvc) =>
{
    var plan = await planSvc.GetByIdAsync(id, GetUserId(ctx));
    var safeName = string.Concat(plan.Name.Where(c => !Path.GetInvalidFileNameChars().Contains(c)));
    if (string.IsNullOrWhiteSpace(safeName)) safeName = "plano";

    return (format?.ToLower() ?? "md") switch
    {
        "docx" => Results.File(
            exportSvc.GenerateDocx(plan),
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            $"{safeName}.docx"),
        "pdf" => Results.File(
            exportSvc.GeneratePdf(plan),
            "application/pdf",
            $"{safeName}.pdf"),
        _ => Results.File(
            Encoding.UTF8.GetBytes(exportSvc.GenerateMarkdown(plan)),
            "text/markdown; charset=utf-8",
            $"{safeName}.md")
    };
});

// ─── Meal Slots (plan-level meal templates) ──────────────
mealPlans.MapPost("/{planId:guid}/slots", async (Guid planId, HttpContext ctx, CreateMealSlotRequest request, MealSlotService svc, UndoService undo) =>
    Results.Json(ApiResponses.Ok(await svc.CreateAsync(planId, GetUserId(ctx), request), undo.LastToken), statusCode: 201));

mealPlans.MapPatch("/{planId:guid}/slots/{slotId:guid}", async (Guid planId, Guid slotId, HttpContext ctx, UpdateMealSlotRequest request, MealSlotService svc, UndoService undo) =>
    Results.Json(ApiResponses.Ok(await svc.UpdateAsync(planId, slotId, GetUserId(ctx), request), undo.LastToken)));

mealPlans.MapPut("/{planId:guid}/slots/order", async (Guid planId, HttpContext ctx, ReorderSlotsRequest request, MealSlotService svc, UndoService undo) =>
{
    await svc.ReorderAsync(planId, GetUserId(ctx), request.SlotIds);
    return Results.Json(ApiResponses.Ok("Ordem atualizada", undo.LastToken));
});

mealPlans.MapDelete("/{planId:guid}/slots/{slotId:guid}", async (Guid planId, Guid slotId, HttpContext ctx, MealSlotService svc, UndoService undo) =>
{
    await svc.DeleteAsync(planId, slotId, GetUserId(ctx));
    return Results.Json(ApiResponses.Ok("Refeição excluída com sucesso", undo.LastToken));
});

// ─── Plan Sharing ────────────────────────────────────────
mealPlans.MapPost("/{planId:guid}/sharing/invite", async (Guid planId, HttpContext ctx, CreateInviteRequest request, MealPlanShareService svc) =>
    Results.Json(ApiResponses.Ok(await svc.GenerateInviteAsync(planId, GetUserId(ctx), request.CanEdit)), statusCode: 201));

mealPlans.MapDelete("/{planId:guid}/sharing/invite", async (Guid planId, HttpContext ctx, MealPlanShareService svc) =>
{
    await svc.RevokeInviteAsync(planId, GetUserId(ctx));
    return Results.Json(new ApiResponse(true, Message: "Convite revogado"));
});

mealPlans.MapPatch("/{planId:guid}/sharing/permission", async (Guid planId, HttpContext ctx, UpdateSharePermissionRequest request, MealPlanShareService svc) =>
{
    await svc.UpdateSharePermissionAsync(planId, GetUserId(ctx), request.CanEdit);
    return Results.Json(new ApiResponse(true, Message: "Permissão atualizada"));
});

mealPlans.MapDelete("/{planId:guid}/sharing/shared-user", async (Guid planId, HttpContext ctx, MealPlanShareService svc) =>
{
    await svc.RemoveShareAsync(planId, GetUserId(ctx));
    return Results.Json(new ApiResponse(true, Message: "Compartilhamento removido"));
});

mealPlans.MapDelete("/{planId:guid}/sharing/leave", async (Guid planId, HttpContext ctx, MealPlanShareService svc) =>
{
    await svc.LeaveShareAsync(planId, GetUserId(ctx));
    return Results.Json(new ApiResponse(true, Message: "Você saiu do plano"));
});

// ─── Plan Invites (standalone) ───────────────────────────
var invites = app.MapGroup("/api/invites").RequireAuthorization();

invites.MapGet("/{token}", async (string token, MealPlanShareService svc) =>
    Results.Json(ApiResponses.Ok(await svc.GetInviteInfoAsync(token))));

invites.MapPost("/{token}/accept", async (string token, HttpContext ctx, MealPlanShareService svc) =>
{
    var planId = await svc.AcceptInviteAsync(token, GetUserId(ctx));
    return Results.Json(ApiResponses.Ok(new { planId }), statusCode: 201);
});

// ─── Meals (read-only, per day) ──────────────────────────
mealPlans.MapGet("/{planId:guid}/days/{day}/meals", async (Guid planId, string day, HttpContext ctx, MealService svc) =>
    Results.Json(ApiResponses.Ok(await svc.GetMealsForDayAsync(planId, day, GetUserId(ctx)))));

// ─── Meal Foods + Meal Toggle ────────────────────────────
var meals = app.MapGroup("/api/meals").RequireAuthorization();

meals.MapPatch("/{mealId:guid}/cheat", async (Guid mealId, HttpContext ctx, UpdateMealCheatRequest request, MealService svc, UndoService undo) =>
    Results.Json(ApiResponses.Ok(await svc.SetCheatAsync(mealId, GetUserId(ctx), request.IsCheat), undo.LastToken)));

meals.MapPost("/{mealId:guid}/copy", async (Guid mealId, HttpContext ctx, CopyMealRequest request, MealService svc, UndoService undo) =>
{
    await svc.CopyToAsync(mealId, GetUserId(ctx), request.TargetMealIds);
    return Results.Json(ApiResponses.Ok("Refeição copiada", undo.LastToken));
});

meals.MapGet("/{mealId:guid}/foods", async (Guid mealId, HttpContext ctx, MealFoodService svc) =>
    Results.Json(ApiResponses.Ok(await svc.GetMealFoodsAsync(mealId, GetUserId(ctx)))));

meals.MapPost("/{mealId:guid}/foods", async (Guid mealId, HttpContext ctx, AddFoodToMealRequest request, MealFoodService svc, UndoService undo) =>
    Results.Json(ApiResponses.Ok(await svc.AddFoodToMealAsync(mealId, GetUserId(ctx), request), undo.LastToken), statusCode: 201));

meals.MapPatch("/{mealId:guid}/foods/{foodId:guid}", async (Guid mealId, Guid foodId, HttpContext ctx, UpdateMealFoodRequest request, MealFoodService svc, UndoService undo) =>
    Results.Json(ApiResponses.Ok(await svc.UpdateMealFoodAsync(mealId, foodId, GetUserId(ctx), request.NewFoodId, request.Quantity), undo.LastToken)));

meals.MapDelete("/{mealId:guid}/foods/{foodId:guid}", async (Guid mealId, Guid foodId, HttpContext ctx, MealFoodService svc, UndoService undo) =>
{
    await svc.RemoveFoodFromMealAsync(mealId, foodId, GetUserId(ctx));
    return Results.Json(ApiResponses.Ok("Alimento removido da refeição", undo.LastToken));
});

// ─── Shopping Lists ───────────────────────────────────────
var shoppingLists = app.MapGroup("/api/shopping-lists").RequireAuthorization();

shoppingLists.MapGet("/", async (HttpContext ctx, ShoppingListService svc) =>
    Results.Json(ApiResponses.Ok(await svc.GetAllForUserAsync(GetUserId(ctx)))));

shoppingLists.MapGet("/{id:guid}", async (Guid id, HttpContext ctx, ShoppingListService svc) =>
    Results.Json(ApiResponses.Ok(await svc.GetByIdAsync(id, GetUserId(ctx)))));

shoppingLists.MapPost("/", async (HttpContext ctx, CreateShoppingListRequest request, ShoppingListService svc) =>
    Results.Json(ApiResponses.Ok(await svc.CreateAsync(GetUserId(ctx), request)), statusCode: 201));

shoppingLists.MapPatch("/{id:guid}", async (Guid id, HttpContext ctx, UpdateShoppingListRequest request, ShoppingListService svc) =>
    Results.Json(ApiResponses.Ok(await svc.UpdateAsync(id, GetUserId(ctx), request))));

shoppingLists.MapDelete("/{id:guid}", async (Guid id, HttpContext ctx, ShoppingListService svc) =>
{
    await svc.DeleteAsync(id, GetUserId(ctx));
    return Results.Json(new ApiResponse(true, Message: "Lista excluída com sucesso"));
});

shoppingLists.MapPut("/{id:guid}/meals", async (Guid id, HttpContext ctx, SetShoppingListMealsRequest request, ShoppingListService svc) =>
    Results.Json(ApiResponses.Ok(await svc.SetMealsAsync(id, GetUserId(ctx), request))));

shoppingLists.MapPost("/{id:guid}/invite", async (Guid id, HttpContext ctx, ShoppingListService svc) =>
    Results.Json(ApiResponses.Ok(await svc.GenerateInviteAsync(id, GetUserId(ctx)))));

shoppingLists.MapDelete("/{id:guid}/invite", async (Guid id, HttpContext ctx, ShoppingListService svc) =>
{
    await svc.RevokeInviteAsync(id, GetUserId(ctx));
    return Results.Json(new ApiResponse(true, Message: "Convite revogado"));
});

shoppingLists.MapPost("/accept/{token}", async (string token, HttpContext ctx, ShoppingListService svc) =>
    Results.Json(ApiResponses.Ok(await svc.AcceptInviteAsync(token, GetUserId(ctx)))));

shoppingLists.MapPost("/{id:guid}/leave", async (Guid id, HttpContext ctx, ShoppingListService svc) =>
{
    await svc.LeaveAsync(id, GetUserId(ctx));
    return Results.Json(new ApiResponse(true, Message: "Você saiu da lista"));
});

shoppingLists.MapDelete("/{id:guid}/members/{memberUserId:guid}", async (Guid id, Guid memberUserId, HttpContext ctx, ShoppingListService svc) =>
{
    await svc.RemoveMemberAsync(id, GetUserId(ctx), memberUserId);
    return Results.Json(new ApiResponse(true, Message: "Membro removido"));
});

// ─── Preset Meals ────────────────────────────────────────
var presetMeals = app.MapGroup("/api/preset-meals").RequireAuthorization();

presetMeals.MapGet("/", async (HttpContext ctx, PresetMealService svc) =>
    Results.Json(ApiResponses.Ok(await svc.GetAllByUserAsync(GetUserId(ctx)))));

presetMeals.MapGet("/{id:guid}", async (Guid id, HttpContext ctx, PresetMealService svc) =>
    Results.Json(ApiResponses.Ok(await svc.GetByIdAsync(id, GetUserId(ctx)))));

presetMeals.MapPost("/", async (HttpContext ctx, CreatePresetMealRequest request, PresetMealService svc, UndoService undo) =>
    Results.Json(ApiResponses.Ok(await svc.CreateAsync(GetUserId(ctx), request), undo.LastToken), statusCode: 201));

presetMeals.MapPatch("/{id:guid}", async (Guid id, HttpContext ctx, UpdatePresetMealRequest request, PresetMealService svc, UndoService undo) =>
    Results.Json(ApiResponses.Ok(await svc.UpdateAsync(id, GetUserId(ctx), request), undo.LastToken)));

presetMeals.MapPost("/{id:guid}/duplicate", async (Guid id, HttpContext ctx, PresetMealService svc, UndoService undo) =>
    Results.Json(ApiResponses.Ok(await svc.DuplicateAsync(id, GetUserId(ctx)), undo.LastToken), statusCode: 201));

presetMeals.MapDelete("/{id:guid}", async (Guid id, HttpContext ctx, PresetMealService svc, UndoService undo) =>
{
    await svc.DeleteAsync(id, GetUserId(ctx));
    return Results.Json(ApiResponses.Ok("Refeição pronta excluída com sucesso", undo.LastToken));
});

presetMeals.MapPost("/{id:guid}/copy-from/{sourceId:guid}", async (Guid id, Guid sourceId, HttpContext ctx, PresetMealService svc, UndoService undo) =>
{
    await svc.CopyFoodsFromAsync(id, sourceId, GetUserId(ctx));
    return Results.Json(ApiResponses.Ok("Alimentos copiados", undo.LastToken));
});

presetMeals.MapPost("/{id:guid}/foods", async (Guid id, HttpContext ctx, AddPresetMealFoodRequest request, PresetMealService svc, UndoService undo) =>
    Results.Json(ApiResponses.Ok(await svc.AddFoodAsync(id, GetUserId(ctx), request), undo.LastToken), statusCode: 201));

presetMeals.MapPatch("/{id:guid}/foods/{foodId:guid}", async (Guid id, Guid foodId, HttpContext ctx, UpdatePresetMealFoodRequest request, PresetMealService svc, UndoService undo) =>
    Results.Json(ApiResponses.Ok(await svc.UpdateFoodAsync(id, foodId, GetUserId(ctx), request.NewFoodId, request.Quantity), undo.LastToken)));

presetMeals.MapDelete("/{id:guid}/foods/{foodId:guid}", async (Guid id, Guid foodId, HttpContext ctx, PresetMealService svc, UndoService undo) =>
{
    await svc.RemoveFoodAsync(id, foodId, GetUserId(ctx));
    return Results.Json(ApiResponses.Ok("Alimento removido da refeição pronta", undo.LastToken));
});

presetMeals.MapPost("/{id:guid}/apply", async (Guid id, HttpContext ctx, ApplyPresetRequest request, PresetMealService svc, UndoService undo) =>
{
    await svc.ApplyAsync(id, GetUserId(ctx), request.TargetMealIds);
    return Results.Json(ApiResponses.Ok("Refeição pronta aplicada", undo.LastToken));
});

// MCP (AI integrations)
var mcp = app.MapGroup("/api/mcp");

mcp.MapPost("/", async (HttpContext ctx, McpJsonRpcRequest request, McpService mcpSvc, OAuthService oauthSvc) =>
{
    var auth = await GetMcpRequestContextAsync(ctx, oauthSvc);
    return await mcpSvc.HandleAsync(request, auth.UserId, auth.CanWrite);
});

mcp.MapGet("/meal-plan-access", async (HttpContext ctx, McpService svc) =>
    Results.Json(ApiResponses.Ok(await svc.GetMealPlanAccessAsync(GetUserId(ctx)))))
    .RequireAuthorization();

mcp.MapPut("/meal-plan-access/{planId:guid}", async (Guid planId, HttpContext ctx, UpdateMcpMealPlanAccessRequest request, McpService svc) =>
    Results.Json(ApiResponses.Ok(await svc.UpdateMealPlanAccessAsync(GetUserId(ctx), planId, request))))
    .RequireAuthorization();

mcp.MapDelete("/meal-plan-access/{planId:guid}", async (Guid planId, HttpContext ctx, McpService svc) =>
{
    await svc.RemoveMealPlanAccessAsync(GetUserId(ctx), planId);
    return Results.Json(new ApiResponse(true, Message: "Acesso MCP removido"));
})
    .RequireAuthorization();

// ─── 404 Fallback ─────────────────────────────────────────
app.MapFallback(() => Results.Json(new ApiResponse(false, Error: "Rota não encontrada"), statusCode: 404));

var port = builder.Configuration["PORT"] ?? "3000";
app.Run($"http://0.0.0.0:{port}");
