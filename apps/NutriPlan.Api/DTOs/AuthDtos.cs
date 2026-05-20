using System.ComponentModel.DataAnnotations;

namespace NutriPlan.Api.DTOs;

public record RegisterRequest
{
    [Required(ErrorMessage = "Nome é obrigatório")]
    [MinLength(1)]
    public required string Name { get; init; }

    [Required(ErrorMessage = "Email inválido")]
    [EmailAddress(ErrorMessage = "Email inválido")]
    public required string Email { get; init; }

    [Required(ErrorMessage = "Senha é obrigatória")]
    [MinLength(6, ErrorMessage = "Senha deve ter no mínimo 6 caracteres")]
    public required string Password { get; init; }
}

public record LoginRequest
{
    [Required(ErrorMessage = "Email inválido")]
    [EmailAddress(ErrorMessage = "Email inválido")]
    public required string Email { get; init; }

    [Required(ErrorMessage = "Senha é obrigatória")]
    [MinLength(1)]
    public required string Password { get; init; }
}

public record AuthResponse(UserDto User, string Token);

public record UserDto(Guid Id, string Name, string Email, Guid? MainMealPlanId);

public record UserWithDateDto(Guid Id, string Name, string Email, Guid? MainMealPlanId, DateTime CreatedAt);
