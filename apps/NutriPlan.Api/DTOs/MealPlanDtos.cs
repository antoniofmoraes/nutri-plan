using System.ComponentModel.DataAnnotations;

namespace NutriPlan.Api.DTOs;

public record CreateMealPlanRequest
{
    [Required(ErrorMessage = "Nome é obrigatório")]
    [MinLength(1)]
    public required string Name { get; init; }

    [Required(ErrorMessage = "Objetivo é obrigatório")]
    [RegularExpression("^(emagrecer|manter|ganhar)$", ErrorMessage = "Objetivo deve ser emagrecer, manter ou ganhar")]
    public required string Goal { get; init; }

    [Range(1, int.MaxValue, ErrorMessage = "Calorias diárias deve ser positivo")]
    public int DailyCalories { get; init; }

    [Range(1, int.MaxValue, ErrorMessage = "Proteína deve ser positivo")]
    public int? DailyProtein { get; init; }

    [Range(1, int.MaxValue, ErrorMessage = "Carboidratos deve ser positivo")]
    public int? DailyCarbs { get; init; }

    [Range(1, int.MaxValue, ErrorMessage = "Gordura deve ser positivo")]
    public int? DailyFat { get; init; }
}

public record UpdateMealPlanRequest
{
    [MinLength(1)]
    public string? Name { get; init; }

    [RegularExpression("^(emagrecer|manter|ganhar)$", ErrorMessage = "Objetivo deve ser emagrecer, manter ou ganhar")]
    public string? Goal { get; init; }

    [Range(1, int.MaxValue, ErrorMessage = "Calorias diárias deve ser positivo")]
    public int? DailyCalories { get; init; }

    public int? DailyProtein { get; init; }
    public int? DailyCarbs { get; init; }
    public int? DailyFat { get; init; }
}

public record CreateMealSlotRequest
{
    [Required(ErrorMessage = "Nome é obrigatório")]
    [MinLength(1)]
    public required string Name { get; init; }

    public string? Time { get; init; }
}

public record UpdateMealSlotRequest
{
    [MinLength(1)]
    public string? Name { get; init; }

    public string? Time { get; init; }
}

public record AddFoodToMealRequest
{
    [Required(ErrorMessage = "ID do alimento é obrigatório")]
    public Guid FoodId { get; init; }

    [Range(0.01, double.MaxValue, ErrorMessage = "Quantidade deve ser positivo")]
    public double Quantity { get; init; } = 100;
}

public record UpdateMealFoodRequest
{
    public Guid? NewFoodId { get; init; }

    [Range(0.01, double.MaxValue, ErrorMessage = "Quantidade deve ser positivo")]
    public double? Quantity { get; init; }
}

public record MealPlanResponse(
    Guid Id,
    string Name,
    string Goal,
    int DailyCalories,
    int? DailyProtein,
    int? DailyCarbs,
    int? DailyFat,
    bool IsMain,
    string Role,
    bool CanEdit,
    string? OwnerName,
    ShareInfoResponse? SharedWith,
    MealPlanInviteResponse? ActiveInvite,
    List<MealSlotResponse> Slots,
    List<DayPlanResponse> Days,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record MealSlotResponse(Guid Id, string Name, string? Time, int SortOrder);

public record DayPlanResponse(string Day, List<MealResponse> Meals);

public record MealResponse(Guid Id, Guid SlotId, string Name, string? Time, bool IsCheat, List<MealFoodResponse> Foods);

public record UpdateMealCheatRequest
{
    public bool IsCheat { get; init; }
}

public record CopyMealRequest
{
    [Required]
    public required List<Guid> TargetMealIds { get; init; }
}

public record ReorderSlotsRequest
{
    [Required]
    public required List<Guid> SlotIds { get; init; }
}

public record MealFoodResponse(Guid Id, double Quantity, FoodResponse Food);
