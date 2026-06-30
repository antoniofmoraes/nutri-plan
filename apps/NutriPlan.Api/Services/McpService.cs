using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using NutriPlan.Api.Data;
using NutriPlan.Api.DTOs;
using NutriPlan.Api.Middleware;
using NutriPlan.Api.Models;

namespace NutriPlan.Api.Services;

public class McpService(
    AppDbContext db,
    MealPlanService mealPlanService,
    FoodService foodService,
    MealService mealService,
    MealFoodService mealFoodService)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<IResult> HandleAsync(McpJsonRpcRequest request, Guid userId)
    {
        if (string.IsNullOrWhiteSpace(request.Method))
            return JsonRpcError(request.Id, -32600, "Requisicao MCP invalida");

        if (request.Id is null && request.Method.StartsWith("notifications/"))
            return Results.NoContent();

        try
        {
            var result = request.Method switch
            {
                "initialize" => Initialize(),
                "tools/list" => ListTools(),
                "tools/call" => await CallToolAsync(request.Params, userId),
                _ => throw new McpProtocolException("Metodo MCP nao encontrado", -32601)
            };

            if (request.Id is null)
                return Results.NoContent();

            return Results.Json(new { jsonrpc = "2.0", id = request.Id, result });
        }
        catch (McpProtocolException ex)
        {
            return JsonRpcError(request.Id, ex.Code, ex.Message);
        }
        catch (JsonException)
        {
            return JsonRpcError(request.Id, -32602, "Parametros MCP invalidos");
        }
        catch (ApiException ex)
        {
            return JsonRpcError(request.Id, StatusToJsonRpcCode(ex.StatusCode), ex.Message);
        }
    }

    public async Task<List<McpMealPlanAccessResponse>> GetMealPlanAccessAsync(Guid userId)
    {
        var plans = await db.MealPlans
            .Where(p => p.UserId == userId || p.SharedWithUserId == userId)
            .OrderByDescending(p => p.UserId == userId)
            .ThenByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.UserId,
                p.SharedWithUserId,
                p.CanEdit
            })
            .ToListAsync();

        var accessByPlanId = await db.McpMealPlanAccesses
            .Where(a => a.UserId == userId)
            .ToDictionaryAsync(a => a.MealPlanId);

        return plans.Select(plan =>
        {
            accessByPlanId.TryGetValue(plan.Id, out var access);
            var canGrantEdit = plan.UserId == userId || (plan.SharedWithUserId == userId && plan.CanEdit);
            return new McpMealPlanAccessResponse(
                plan.Id,
                plan.Name,
                access?.CanRead ?? false,
                access?.CanEdit ?? false,
                canGrantEdit,
                access?.UpdatedAt
            );
        }).ToList();
    }

    public async Task<McpMealPlanAccessResponse> UpdateMealPlanAccessAsync(Guid userId, Guid planId, UpdateMcpMealPlanAccessRequest request)
    {
        var plan = await db.MealPlans
            .FirstOrDefaultAsync(p => p.Id == planId);

        if (plan is null)
            throw new ApiException("Plano alimentar nao encontrado", 404);
        if (plan.UserId != userId && plan.SharedWithUserId != userId)
            throw new ApiException("Acesso negado", 403);

        var canGrantEdit = plan.UserId == userId || (plan.SharedWithUserId == userId && plan.CanEdit);
        if (request.CanEdit && !canGrantEdit)
            throw new ApiException("Voce nao pode liberar edicao MCP para este plano", 403);

        var access = await db.McpMealPlanAccesses
            .FirstOrDefaultAsync(a => a.UserId == userId && a.MealPlanId == planId);

        if (!request.CanRead)
        {
            if (access is not null)
            {
                db.McpMealPlanAccesses.Remove(access);
                await db.SaveChangesAsync();
            }

            return new McpMealPlanAccessResponse(plan.Id, plan.Name, false, false, canGrantEdit, null);
        }

        if (access is null)
        {
            access = new McpMealPlanAccess
            {
                UserId = userId,
                MealPlanId = planId
            };
            db.McpMealPlanAccesses.Add(access);
        }

        access.CanRead = true;
        access.CanEdit = request.CanEdit;
        access.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();

        return new McpMealPlanAccessResponse(plan.Id, plan.Name, access.CanRead, access.CanEdit, canGrantEdit, access.UpdatedAt);
    }

    public async Task RemoveMealPlanAccessAsync(Guid userId, Guid planId)
    {
        var access = await db.McpMealPlanAccesses
            .FirstOrDefaultAsync(a => a.UserId == userId && a.MealPlanId == planId);

        if (access is null) return;

        db.McpMealPlanAccesses.Remove(access);
        await db.SaveChangesAsync();
    }

    private static object Initialize() => new
    {
        protocolVersion = "2025-06-18",
        capabilities = new { tools = new { } },
        serverInfo = new { name = "nutriplan", version = "1.0.0" }
    };

    private static object ListTools() => new
    {
        tools = new object[]
        {
            Tool(
                "nutriplan_list_meal_plans",
                "Lista os planos alimentares liberados para a IA.",
                new { type = "object", properties = new { }, additionalProperties = false }
            ),
            Tool(
                "nutriplan_get_meal_plan",
                "Consulta um plano alimentar liberado para a IA, incluindo dias, refeicoes e alimentos.",
                ObjectSchema(new Dictionary<string, object>
                {
                    ["planId"] = StringSchema("uuid")
                }, ["planId"])
            ),
            Tool(
                "nutriplan_search_foods",
                "Busca alimentos da base TBCA para usar nas refeicoes.",
                ObjectSchema(new Dictionary<string, object>
                {
                    ["search"] = new { type = "string" },
                    ["pageSize"] = new { type = "integer", minimum = 1, maximum = 50 }
                })
            ),
            Tool(
                "nutriplan_update_meal_plan_targets",
                "Edita nome, objetivo e metas nutricionais de um plano liberado com permissao de edicao.",
                ObjectSchema(new Dictionary<string, object>
                {
                    ["planId"] = StringSchema("uuid"),
                    ["name"] = new { type = "string" },
                    ["goal"] = new { type = "string", @enum = new[] { "emagrecer", "manter", "ganhar" } },
                    ["dailyCalories"] = new { type = "integer", minimum = 1 },
                    ["dailyProtein"] = new { type = "integer", minimum = 1 },
                    ["dailyCarbs"] = new { type = "integer", minimum = 1 },
                    ["dailyFat"] = new { type = "integer", minimum = 1 }
                }, ["planId"])
            ),
            Tool(
                "nutriplan_set_meal_cheat",
                "Marca ou desmarca uma refeicao como livre em plano liberado com permissao de edicao.",
                ObjectSchema(new Dictionary<string, object>
                {
                    ["mealId"] = StringSchema("uuid"),
                    ["isCheat"] = new { type = "boolean" }
                }, ["mealId", "isCheat"])
            ),
            Tool(
                "nutriplan_add_food_to_meal",
                "Adiciona ou atualiza um alimento em uma refeicao de plano liberado com permissao de edicao.",
                ObjectSchema(new Dictionary<string, object>
                {
                    ["mealId"] = StringSchema("uuid"),
                    ["foodId"] = StringSchema("uuid"),
                    ["quantity"] = new { type = "number", minimum = 0.01 }
                }, ["mealId", "foodId"])
            ),
            Tool(
                "nutriplan_update_meal_food",
                "Altera quantidade ou substitui um alimento em uma refeicao de plano liberado com permissao de edicao.",
                ObjectSchema(new Dictionary<string, object>
                {
                    ["mealId"] = StringSchema("uuid"),
                    ["foodId"] = StringSchema("uuid"),
                    ["newFoodId"] = StringSchema("uuid"),
                    ["quantity"] = new { type = "number", minimum = 0.01 }
                }, ["mealId", "foodId"])
            ),
            Tool(
                "nutriplan_remove_food_from_meal",
                "Remove um alimento de uma refeicao de plano liberado com permissao de edicao.",
                ObjectSchema(new Dictionary<string, object>
                {
                    ["mealId"] = StringSchema("uuid"),
                    ["foodId"] = StringSchema("uuid")
                }, ["mealId", "foodId"])
            )
        }
    };

    private async Task<object> CallToolAsync(JsonElement? parameters, Guid userId)
    {
        var call = DeserializeParams<McpToolCallParams>(parameters);

        var result = call.Name switch
        {
            "nutriplan_list_meal_plans" => await ListMealPlansAsync(userId),
            "nutriplan_get_meal_plan" => await GetMealPlanAsync(DeserializeArgs<McpPlanIdArgs>(call.Arguments), userId),
            "nutriplan_search_foods" => await SearchFoodsAsync(DeserializeArgs<McpSearchFoodsArgs>(call.Arguments)),
            "nutriplan_update_meal_plan_targets" => await UpdateMealPlanTargetsAsync(DeserializeArgs<McpUpdateMealPlanArgs>(call.Arguments), userId),
            "nutriplan_set_meal_cheat" => await SetMealCheatAsync(DeserializeArgs<McpSetMealCheatArgs>(call.Arguments), userId),
            "nutriplan_add_food_to_meal" => await AddFoodToMealAsync(DeserializeArgs<McpAddFoodToMealArgs>(call.Arguments), userId),
            "nutriplan_update_meal_food" => await UpdateMealFoodAsync(DeserializeArgs<McpUpdateMealFoodArgs>(call.Arguments), userId),
            "nutriplan_remove_food_from_meal" => await RemoveFoodFromMealAsync(DeserializeArgs<McpRemoveFoodFromMealArgs>(call.Arguments), userId),
            _ => throw new McpProtocolException("Ferramenta MCP nao encontrada", -32602)
        };

        return ToolResult(result);
    }

    private async Task<List<McpPlanSummaryResponse>> ListMealPlansAsync(Guid userId)
    {
        var mainPlanId = await db.Users
            .Where(u => u.Id == userId)
            .Select(u => u.MainMealPlanId)
            .FirstOrDefaultAsync();

        return await db.McpMealPlanAccesses
            .Include(a => a.MealPlan)
            .Where(a =>
                a.UserId == userId
                && a.CanRead
                && (a.MealPlan.UserId == userId || a.MealPlan.SharedWithUserId == userId))
            .OrderByDescending(a => a.MealPlanId == mainPlanId)
            .ThenByDescending(a => a.MealPlan.CreatedAt)
            .Select(a => new McpPlanSummaryResponse(
                a.MealPlan.Id,
                a.MealPlan.Name,
                a.MealPlan.Goal,
                a.MealPlan.DailyCalories,
                a.MealPlan.DailyProtein,
                a.MealPlan.DailyCarbs,
                a.MealPlan.DailyFat,
                a.MealPlan.Id == mainPlanId,
                a.CanEdit,
                a.MealPlan.UpdatedAt
            ))
            .ToListAsync();
    }

    private async Task<MealPlanResponse> GetMealPlanAsync(McpPlanIdArgs args, Guid userId)
    {
        await EnsurePlanMcpReadAccessAsync(args.PlanId, userId);
        return await mealPlanService.GetByIdAsync(args.PlanId, userId);
    }

    private async Task<PaginatedResponse<FoodResponse>> SearchFoodsAsync(McpSearchFoodsArgs args)
    {
        var pageSize = Math.Clamp(args.PageSize ?? 20, 1, 50);
        return await foodService.GetAllAsync(args.Search, page: 1, pageSize);
    }

    private async Task<MealPlanResponse> UpdateMealPlanTargetsAsync(McpUpdateMealPlanArgs args, Guid userId)
    {
        await EnsurePlanMcpEditAccessAsync(args.PlanId, userId);

        return await mealPlanService.UpdateAsync(args.PlanId, userId, new UpdateMealPlanRequest
        {
            Name = args.Name,
            Goal = args.Goal,
            DailyCalories = args.DailyCalories,
            DailyProtein = args.DailyProtein,
            DailyCarbs = args.DailyCarbs,
            DailyFat = args.DailyFat
        });
    }

    private async Task<MealResponse> SetMealCheatAsync(McpSetMealCheatArgs args, Guid userId)
    {
        var planId = await GetPlanIdForMealAsync(args.MealId);
        await EnsurePlanMcpEditAccessAsync(planId, userId);
        return await mealService.SetCheatAsync(args.MealId, userId, args.IsCheat);
    }

    private async Task<MealFoodResponse> AddFoodToMealAsync(McpAddFoodToMealArgs args, Guid userId)
    {
        var planId = await GetPlanIdForMealAsync(args.MealId);
        await EnsurePlanMcpEditAccessAsync(planId, userId);
        return await mealFoodService.AddFoodToMealAsync(args.MealId, userId, new AddFoodToMealRequest
        {
            FoodId = args.FoodId,
            Quantity = args.Quantity
        });
    }

    private async Task<MealFoodResponse> UpdateMealFoodAsync(McpUpdateMealFoodArgs args, Guid userId)
    {
        var planId = await GetPlanIdForMealAsync(args.MealId);
        await EnsurePlanMcpEditAccessAsync(planId, userId);
        return await mealFoodService.UpdateMealFoodAsync(args.MealId, args.FoodId, userId, args.NewFoodId, args.Quantity);
    }

    private async Task<object> RemoveFoodFromMealAsync(McpRemoveFoodFromMealArgs args, Guid userId)
    {
        var planId = await GetPlanIdForMealAsync(args.MealId);
        await EnsurePlanMcpEditAccessAsync(planId, userId);
        await mealFoodService.RemoveFoodFromMealAsync(args.MealId, args.FoodId, userId);
        return new { message = "Alimento removido da refeicao" };
    }

    private async Task EnsurePlanMcpReadAccessAsync(Guid planId, Guid userId)
    {
        var access = await LoadMcpPlanAccessAsync(planId, userId);
        if (!access.CanRead)
            throw new ApiException("Plano nao liberado para MCP", 403);
    }

    private async Task EnsurePlanMcpEditAccessAsync(Guid planId, Guid userId)
    {
        var access = await LoadMcpPlanAccessAsync(planId, userId);
        if (!access.CanEdit)
            throw new ApiException("Plano nao liberado para edicao MCP", 403);

        MealPlanService.AssertEditAccess(access.MealPlan, userId);
    }

    private async Task<McpMealPlanAccess> LoadMcpPlanAccessAsync(Guid planId, Guid userId)
    {
        var access = await db.McpMealPlanAccesses
            .Include(a => a.MealPlan)
            .FirstOrDefaultAsync(a => a.UserId == userId && a.MealPlanId == planId);

        if (access is null || (access.MealPlan.UserId != userId && access.MealPlan.SharedWithUserId != userId))
            throw new ApiException("Plano nao liberado para MCP", 403);

        return access;
    }

    private async Task<Guid> GetPlanIdForMealAsync(Guid mealId)
    {
        var meal = await db.Meals
            .Where(m => m.Id == mealId)
            .Select(m => new { m.DayPlan.MealPlanId })
            .FirstOrDefaultAsync();

        if (meal is null)
            throw new ApiException("Refeicao nao encontrada", 404);

        return meal.MealPlanId;
    }

    private static T DeserializeParams<T>(JsonElement? value)
    {
        if (value is null)
            throw new McpProtocolException("Parametros MCP obrigatorios", -32602);

        return value.Value.Deserialize<T>(JsonOptions)
            ?? throw new McpProtocolException("Parametros MCP invalidos", -32602);
    }

    private static T DeserializeArgs<T>(JsonElement? value)
    {
        if (value is null || value.Value.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null)
            return JsonSerializer.Deserialize<T>("{}", JsonOptions)!;

        return value.Value.Deserialize<T>(JsonOptions)
            ?? throw new McpProtocolException("Argumentos MCP invalidos", -32602);
    }

    private static object Tool(string name, string description, object inputSchema) => new
    {
        name,
        description,
        inputSchema
    };

    private static object ObjectSchema(Dictionary<string, object> properties, string[]? required = null) => new
    {
        type = "object",
        properties,
        required = required ?? [],
        additionalProperties = false
    };

    private static object StringSchema(string format) => new
    {
        type = "string",
        format
    };

    private static object ToolResult(object data) => new
    {
        content = new object[]
        {
            new
            {
                type = "text",
                text = JsonSerializer.Serialize(data, JsonOptions)
            }
        },
        structuredContent = data
    };

    private static IResult JsonRpcError(JsonElement? id, int code, string message) =>
        Results.Json(new
        {
            jsonrpc = "2.0",
            id,
            error = new { code, message }
        });

    private static int StatusToJsonRpcCode(int statusCode) => statusCode switch
    {
        400 => -32602,
        401 => -32001,
        403 => -32003,
        404 => -32004,
        _ => -32000
    };

    private class McpProtocolException(string message, int code) : Exception(message)
    {
        public int Code { get; } = code;
    }
}
