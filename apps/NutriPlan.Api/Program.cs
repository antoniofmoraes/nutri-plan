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
builder.Services.AddScoped<MealPlanService>();
builder.Services.AddScoped<MealPlanShareService>();
builder.Services.AddScoped<MealSlotService>();
builder.Services.AddScoped<MealService>();
builder.Services.AddScoped<MealFoodService>();
builder.Services.AddScoped<ShoppingListService>();
builder.Services.AddScoped<PresetMealService>();
builder.Services.AddScoped<MealPlanExportService>();

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
    await DbSeeder.SeedAsync(db);
}

// Helper to extract userId from JWT claims
static Guid GetUserId(HttpContext ctx)
{
    var claim = ctx.User.FindFirst("userId")?.Value;
    return claim is not null ? Guid.Parse(claim) : throw new ApiException("Token inválido", 401);
}

// ─── Health ───────────────────────────────────────────────
app.MapGet("/", () => Results.Json(new { success = true, message = "NutriPlan API", version = "1.0.0", timestamp = DateTime.UtcNow }));
app.MapGet("/health", () => Results.Json(new { status = "ok" }));

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
// Leitura: qualquer usuário autenticado. Mutação: apenas admin (o catálogo é
// global/compartilhado — sem admin gate, qualquer user vandalizaria a base).
var foods = app.MapGroup("/api/foods").RequireAuthorization();

foods.MapGet("/", async (string? search, int? page, int? pageSize, FoodService svc) =>
    Results.Json(ApiResponses.Ok(await svc.GetAllAsync(search, page ?? 1, pageSize ?? 50))));

foods.MapGet("/{id:guid}", async (Guid id, FoodService svc) =>
    Results.Json(ApiResponses.Ok(await svc.GetByIdAsync(id))));

foods.MapPost("/", async (CreateFoodRequest request, FoodService svc) =>
    Results.Json(ApiResponses.Ok(await svc.CreateAsync(request)), statusCode: 201))
    .RequireAuthorization("Admin");

foods.MapPatch("/{id:guid}", async (Guid id, UpdateFoodRequest request, FoodService svc) =>
    Results.Json(ApiResponses.Ok(await svc.UpdateAsync(id, request))))
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

mealPlans.MapPost("/", async (HttpContext ctx, CreateMealPlanRequest request, MealPlanService svc) =>
    Results.Json(ApiResponses.Ok(await svc.CreateAsync(GetUserId(ctx), request)), statusCode: 201));

mealPlans.MapPatch("/{id:guid}", async (Guid id, HttpContext ctx, UpdateMealPlanRequest request, MealPlanService svc) =>
    Results.Json(ApiResponses.Ok(await svc.UpdateAsync(id, GetUserId(ctx), request))));

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
mealPlans.MapPost("/{planId:guid}/slots", async (Guid planId, HttpContext ctx, CreateMealSlotRequest request, MealSlotService svc) =>
    Results.Json(ApiResponses.Ok(await svc.CreateAsync(planId, GetUserId(ctx), request)), statusCode: 201));

mealPlans.MapPatch("/{planId:guid}/slots/{slotId:guid}", async (Guid planId, Guid slotId, HttpContext ctx, UpdateMealSlotRequest request, MealSlotService svc) =>
    Results.Json(ApiResponses.Ok(await svc.UpdateAsync(planId, slotId, GetUserId(ctx), request))));

mealPlans.MapPut("/{planId:guid}/slots/order", async (Guid planId, HttpContext ctx, ReorderSlotsRequest request, MealSlotService svc) =>
{
    await svc.ReorderAsync(planId, GetUserId(ctx), request.SlotIds);
    return Results.Json(new ApiResponse(true, Message: "Ordem atualizada"));
});

mealPlans.MapDelete("/{planId:guid}/slots/{slotId:guid}", async (Guid planId, Guid slotId, HttpContext ctx, MealSlotService svc) =>
{
    await svc.DeleteAsync(planId, slotId, GetUserId(ctx));
    return Results.Json(new ApiResponse(true, Message: "Refeição excluída com sucesso"));
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

meals.MapPatch("/{mealId:guid}/cheat", async (Guid mealId, HttpContext ctx, UpdateMealCheatRequest request, MealService svc) =>
    Results.Json(ApiResponses.Ok(await svc.SetCheatAsync(mealId, GetUserId(ctx), request.IsCheat))));

meals.MapPost("/{mealId:guid}/copy", async (Guid mealId, HttpContext ctx, CopyMealRequest request, MealService svc) =>
{
    await svc.CopyToAsync(mealId, GetUserId(ctx), request.TargetMealIds);
    return Results.Json(new ApiResponse(true, Message: "Refeição copiada"));
});

meals.MapGet("/{mealId:guid}/foods", async (Guid mealId, HttpContext ctx, MealFoodService svc) =>
    Results.Json(ApiResponses.Ok(await svc.GetMealFoodsAsync(mealId, GetUserId(ctx)))));

meals.MapPost("/{mealId:guid}/foods", async (Guid mealId, HttpContext ctx, AddFoodToMealRequest request, MealFoodService svc) =>
    Results.Json(ApiResponses.Ok(await svc.AddFoodToMealAsync(mealId, GetUserId(ctx), request)), statusCode: 201));

meals.MapPatch("/{mealId:guid}/foods/{foodId:guid}", async (Guid mealId, Guid foodId, HttpContext ctx, UpdateMealFoodRequest request, MealFoodService svc) =>
    Results.Json(ApiResponses.Ok(await svc.UpdateMealFoodAsync(mealId, foodId, GetUserId(ctx), request.NewFoodId, request.Quantity))));

meals.MapDelete("/{mealId:guid}/foods/{foodId:guid}", async (Guid mealId, Guid foodId, HttpContext ctx, MealFoodService svc) =>
{
    await svc.RemoveFoodFromMealAsync(mealId, foodId, GetUserId(ctx));
    return Results.Json(new ApiResponse(true, Message: "Alimento removido da refeição"));
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

presetMeals.MapPost("/", async (HttpContext ctx, CreatePresetMealRequest request, PresetMealService svc) =>
    Results.Json(ApiResponses.Ok(await svc.CreateAsync(GetUserId(ctx), request)), statusCode: 201));

presetMeals.MapPatch("/{id:guid}", async (Guid id, HttpContext ctx, UpdatePresetMealRequest request, PresetMealService svc) =>
    Results.Json(ApiResponses.Ok(await svc.UpdateAsync(id, GetUserId(ctx), request))));

presetMeals.MapPost("/{id:guid}/duplicate", async (Guid id, HttpContext ctx, PresetMealService svc) =>
    Results.Json(ApiResponses.Ok(await svc.DuplicateAsync(id, GetUserId(ctx))), statusCode: 201));

presetMeals.MapDelete("/{id:guid}", async (Guid id, HttpContext ctx, PresetMealService svc) =>
{
    await svc.DeleteAsync(id, GetUserId(ctx));
    return Results.Json(new ApiResponse(true, Message: "Refeição pronta excluída com sucesso"));
});

presetMeals.MapPost("/{id:guid}/foods", async (Guid id, HttpContext ctx, AddPresetMealFoodRequest request, PresetMealService svc) =>
    Results.Json(ApiResponses.Ok(await svc.AddFoodAsync(id, GetUserId(ctx), request)), statusCode: 201));

presetMeals.MapPatch("/{id:guid}/foods/{foodId:guid}", async (Guid id, Guid foodId, HttpContext ctx, UpdatePresetMealFoodRequest request, PresetMealService svc) =>
    Results.Json(ApiResponses.Ok(await svc.UpdateFoodAsync(id, foodId, GetUserId(ctx), request.NewFoodId, request.Quantity))));

presetMeals.MapDelete("/{id:guid}/foods/{foodId:guid}", async (Guid id, Guid foodId, HttpContext ctx, PresetMealService svc) =>
{
    await svc.RemoveFoodAsync(id, foodId, GetUserId(ctx));
    return Results.Json(new ApiResponse(true, Message: "Alimento removido da refeição pronta"));
});

presetMeals.MapPost("/{id:guid}/apply", async (Guid id, HttpContext ctx, ApplyPresetRequest request, PresetMealService svc) =>
{
    await svc.ApplyAsync(id, GetUserId(ctx), request.TargetMealIds);
    return Results.Json(new ApiResponse(true, Message: "Refeição pronta aplicada"));
});

// ─── 404 Fallback ─────────────────────────────────────────
app.MapFallback(() => Results.Json(new ApiResponse(false, Error: "Rota não encontrada"), statusCode: 404));

var port = builder.Configuration["PORT"] ?? "3000";
app.Run($"http://0.0.0.0:{port}");
