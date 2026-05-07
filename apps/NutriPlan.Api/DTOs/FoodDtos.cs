using System.ComponentModel.DataAnnotations;

namespace NutriPlan.Api.DTOs;

public record CreateFoodRequest
{
    [Required(ErrorMessage = "Nome é obrigatório")]
    [MinLength(1)]
    public required string Name { get; init; }

    [Range(0, double.MaxValue, ErrorMessage = "Calorias deve ser positivo")]
    public double Calories { get; init; }

    [Range(0, double.MaxValue, ErrorMessage = "Proteína deve ser positivo")]
    public double Protein { get; init; }

    [Range(0, double.MaxValue, ErrorMessage = "Carboidratos deve ser positivo")]
    public double Carbs { get; init; }

    [Range(0, double.MaxValue, ErrorMessage = "Gordura deve ser positivo")]
    public double Fat { get; init; }

    public string Portion { get; init; } = "100g";
}

public record UpdateFoodRequest
{
    [MinLength(1)]
    public string? Name { get; init; }

    [Range(0, double.MaxValue, ErrorMessage = "Calorias deve ser positivo")]
    public double? Calories { get; init; }

    [Range(0, double.MaxValue, ErrorMessage = "Proteína deve ser positivo")]
    public double? Protein { get; init; }

    [Range(0, double.MaxValue, ErrorMessage = "Carboidratos deve ser positivo")]
    public double? Carbs { get; init; }

    [Range(0, double.MaxValue, ErrorMessage = "Gordura deve ser positivo")]
    public double? Fat { get; init; }

    public string? Portion { get; init; }
}

public record FoodResponse(Guid Id, string Name, double Calories, double Protein, double Carbs, double Fat, string Portion);
