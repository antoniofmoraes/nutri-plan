using System.ComponentModel.DataAnnotations;

namespace NutriPlan.Api.DTOs;

public record UpdateUserRequest
{
    [MinLength(1, ErrorMessage = "Nome é obrigatório")]
    public string? Name { get; init; }

    [EmailAddress(ErrorMessage = "Email inválido")]
    public string? Email { get; init; }

    /// <summary>Obrigatório quando trocar o email — confirma identidade.</summary>
    public string? CurrentPassword { get; init; }
}

public record SetMainPlanRequest
{
    public Guid? PlanId { get; init; }
}
