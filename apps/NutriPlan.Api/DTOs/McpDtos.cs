using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace NutriPlan.Api.DTOs;

public record McpJsonRpcRequest
{
    public string Jsonrpc { get; init; } = "2.0";
    public JsonElement? Id { get; init; }
    public required string Method { get; init; }
    public JsonElement? Params { get; init; }
}

public record McpToolCallParams
{
    public required string Name { get; init; }
    public JsonElement? Arguments { get; init; }
}

public record UpdateMcpMealPlanAccessRequest
{
    public bool CanRead { get; init; } = true;
    public bool CanEdit { get; init; } = false;
}

public record McpMealPlanAccessResponse(
    Guid PlanId,
    string PlanName,
    bool CanRead,
    bool CanEdit,
    bool CanGrantEdit,
    DateTime? UpdatedAt
);

public record McpPlanSummaryResponse(
    Guid Id,
    string Name,
    string Goal,
    int DailyCalories,
    int? DailyProtein,
    int? DailyCarbs,
    int? DailyFat,
    bool IsMain,
    bool CanEdit,
    DateTime UpdatedAt
);

public record McpPlanIdArgs
{
    [Required]
    public Guid PlanId { get; init; }
}

public record McpSearchFoodsArgs
{
    public string? Search { get; init; }
    public int? PageSize { get; init; }
}

public record McpUpdateMealPlanArgs
{
    [Required]
    public Guid PlanId { get; init; }

    public string? Name { get; init; }
    public string? Goal { get; init; }
    public int? DailyCalories { get; init; }
    public int? DailyProtein { get; init; }
    public int? DailyCarbs { get; init; }
    public int? DailyFat { get; init; }
}

public record McpSetMealCheatArgs
{
    [Required]
    public Guid MealId { get; init; }

    public bool IsCheat { get; init; }
}

public record McpAddFoodToMealArgs
{
    [Required]
    public Guid MealId { get; init; }

    [Required]
    public Guid FoodId { get; init; }

    public double Quantity { get; init; } = 100;
}

public record McpUpdateMealFoodArgs
{
    [Required]
    public Guid MealId { get; init; }

    [Required]
    public Guid FoodId { get; init; }

    public Guid? NewFoodId { get; init; }
    public double? Quantity { get; init; }
}

public record McpRemoveFoodFromMealArgs
{
    [Required]
    public Guid MealId { get; init; }

    [Required]
    public Guid FoodId { get; init; }
}
