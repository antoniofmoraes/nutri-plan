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

public record CreateMealRequest
{
    [Required(ErrorMessage = "Nome é obrigatório")]
    [MinLength(1)]
    public required string Name { get; init; }

    public string? Time { get; init; }
}

public record UpdateMealRequest
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

public record UpdateFoodQuantityRequest
{
    [Range(0.01, double.MaxValue, ErrorMessage = "Quantidade deve ser positivo")]
    public double Quantity { get; init; }
}

public record MealPlanResponse(
    Guid Id,
    string Name,
    string Goal,
    int DailyCalories,
    int? DailyProtein,
    int? DailyCarbs,
    int? DailyFat,
    List<DayPlanResponse> Days,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record DayPlanResponse(string Day, List<MealResponse> Meals);

public record MealResponse(Guid Id, string Name, string? Time, List<MealFoodResponse> Foods);

public record MealFoodResponse(Guid Id, double Quantity, FoodResponse Food);
