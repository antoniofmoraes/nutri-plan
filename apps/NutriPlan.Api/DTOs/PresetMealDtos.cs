using System.ComponentModel.DataAnnotations;

namespace NutriPlan.Api.DTOs;

public record CreatePresetMealRequest
{
    [Required(ErrorMessage = "Nome é obrigatório")]
    [MinLength(1)]
    public required string Name { get; init; }
}

public record UpdatePresetMealRequest
{
    [MinLength(1)]
    public string? Name { get; init; }
}

public record AddPresetMealFoodRequest
{
    [Required(ErrorMessage = "ID do alimento é obrigatório")]
    public Guid FoodId { get; init; }

    [Range(0.01, double.MaxValue, ErrorMessage = "Quantidade deve ser positivo")]
    public double Quantity { get; init; } = 100;
}

public record UpdatePresetMealFoodRequest
{
    public Guid? NewFoodId { get; init; }

    [Range(0.01, double.MaxValue, ErrorMessage = "Quantidade deve ser positivo")]
    public double? Quantity { get; init; }
}

public record ApplyPresetRequest
{
    [Required]
    public required List<Guid> TargetMealIds { get; init; }
}

public record PresetMealFoodResponse(Guid Id, double Quantity, FoodResponse Food);

public record PresetMealResponse(
    Guid Id,
    string Name,
    List<PresetMealFoodResponse> Foods,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
