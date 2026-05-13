using System.Text;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
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
    catch { /* fallback to original hostname */ }
    connectionString = $"Host={host};Port={dbMatch.Groups[4].Value};Database={dbMatch.Groups[5].Value};Username={dbMatch.Groups[1].Value};Password={dbMatch.Groups[2].Value};SSL Mode=Require;Trust Server Certificate=true";
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// JWT Authentication
var jwtSecret = builder.Configuration["JWT_SECRET"]
    ?? builder.Configuration["Jwt:Secret"]
    ?? "default-secret-change-me";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero
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

builder.Services.AddAuthorization();

// CORS
var corsOrigin = builder.Configuration["CORS_ORIGIN"] ?? "*";
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (corsOrigin == "*")
            policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
        else
            policy.WithOrigins(corsOrigin.Split(','))
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
    });
});

// Services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<FoodService>();
builder.Services.AddScoped<MealPlanService>();
builder.Services.AddScoped<MealSlotService>();
builder.Services.AddScoped<MealService>();
builder.Services.AddScoped<MealFoodService>();
builder.Services.AddScoped<ShoppingListService>();

// JSON serialization
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

var app = builder.Build();

// Middleware
app.UseMiddleware<ExceptionMiddleware>();
app.UseCors();
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
    Results.Json(ApiResponses.Ok(await svc.RegisterAsync(request)), statusCode: 201));

auth.MapPost("/login", async (LoginRequest request, AuthService svc) =>
    Results.Json(ApiResponses.Ok(await svc.LoginAsync(request))));

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

users.MapDelete("/me", async (HttpContext ctx, UserService svc) =>
{
    await svc.DeleteUserAsync(GetUserId(ctx));
    return Results.Json(new ApiResponse(true, Message: "Usuário excluído com sucesso"));
});

// ─── Foods ────────────────────────────────────────────────
var foods = app.MapGroup("/api/foods").RequireAuthorization();

foods.MapGet("/", async (string? search, int? page, int? pageSize, FoodService svc) =>
    Results.Json(ApiResponses.Ok(await svc.GetAllAsync(search, page ?? 1, pageSize ?? 50))));

foods.MapGet("/{id:guid}", async (Guid id, FoodService svc) =>
    Results.Json(ApiResponses.Ok(await svc.GetByIdAsync(id))));

foods.MapPost("/", async (CreateFoodRequest request, FoodService svc) =>
    Results.Json(ApiResponses.Ok(await svc.CreateAsync(request)), statusCode: 201));

foods.MapPatch("/{id:guid}", async (Guid id, UpdateFoodRequest request, FoodService svc) =>
    Results.Json(ApiResponses.Ok(await svc.UpdateAsync(id, request))));

foods.MapDelete("/{id:guid}", async (Guid id, FoodService svc) =>
{
    await svc.DeleteAsync(id);
    return Results.Json(new ApiResponse(true, Message: "Alimento excluído com sucesso"));
});

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

// ─── Meal Slots (plan-level meal templates) ──────────────
mealPlans.MapPost("/{planId:guid}/slots", async (Guid planId, HttpContext ctx, CreateMealSlotRequest request, MealSlotService svc) =>
    Results.Json(ApiResponses.Ok(await svc.CreateAsync(planId, GetUserId(ctx), request)), statusCode: 201));

mealPlans.MapPatch("/{planId:guid}/slots/{slotId:guid}", async (Guid planId, Guid slotId, HttpContext ctx, UpdateMealSlotRequest request, MealSlotService svc) =>
    Results.Json(ApiResponses.Ok(await svc.UpdateAsync(planId, slotId, GetUserId(ctx), request))));

mealPlans.MapDelete("/{planId:guid}/slots/{slotId:guid}", async (Guid planId, Guid slotId, HttpContext ctx, MealSlotService svc) =>
{
    await svc.DeleteAsync(planId, slotId, GetUserId(ctx));
    return Results.Json(new ApiResponse(true, Message: "Refeição excluída com sucesso"));
});

// ─── Meals (read-only, per day) ──────────────────────────
mealPlans.MapGet("/{planId:guid}/days/{day}/meals", async (Guid planId, string day, HttpContext ctx, MealService svc) =>
    Results.Json(ApiResponses.Ok(await svc.GetMealsForDayAsync(planId, day, GetUserId(ctx)))));

// ─── Meal Foods ───────────────────────────────────────────
var meals = app.MapGroup("/api/meals").RequireAuthorization();

meals.MapGet("/{mealId:guid}/foods", async (Guid mealId, HttpContext ctx, MealFoodService svc) =>
    Results.Json(ApiResponses.Ok(await svc.GetMealFoodsAsync(mealId, GetUserId(ctx)))));

meals.MapPost("/{mealId:guid}/foods", async (Guid mealId, HttpContext ctx, AddFoodToMealRequest request, MealFoodService svc) =>
    Results.Json(ApiResponses.Ok(await svc.AddFoodToMealAsync(mealId, GetUserId(ctx), request)), statusCode: 201));

meals.MapPatch("/{mealId:guid}/foods/{foodId:guid}", async (Guid mealId, Guid foodId, HttpContext ctx, UpdateFoodQuantityRequest request, MealFoodService svc) =>
    Results.Json(ApiResponses.Ok(await svc.UpdateFoodQuantityAsync(mealId, foodId, GetUserId(ctx), request.Quantity))));

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

// ─── 404 Fallback ─────────────────────────────────────────
app.MapFallback(() => Results.Json(new ApiResponse(false, Error: "Rota não encontrada"), statusCode: 404));

var port = builder.Configuration["PORT"] ?? "3000";
app.Run($"http://0.0.0.0:{port}");
