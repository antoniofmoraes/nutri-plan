using System.ComponentModel.DataAnnotations;

namespace NutriPlan.Api.DTOs;

public record UpdateUserRequest
{
    [MinLength(1, ErrorMessage = "Nome é obrigatório")]
    public string? Name { get; init; }

    [EmailAddress(ErrorMessage = "Email inválido")]
    public string? Email { get; init; }
}
