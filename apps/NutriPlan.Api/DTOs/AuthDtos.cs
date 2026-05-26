using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

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

public record UserDto(Guid Id, string Name, string Email, Guid? MainMealPlanId, bool IsAdmin);

public record UserWithDateDto(Guid Id, string Name, string Email, Guid? MainMealPlanId, bool IsAdmin, DateTime CreatedAt);

public record GoogleAuthRequest
{
    [Required(ErrorMessage = "Token do Google é obrigatório")]
    public required string AccessToken { get; init; }
}

public record GoogleLinkRequest
{
    [Required(ErrorMessage = "Token do Google é obrigatório")]
    public required string AccessToken { get; init; }

    [Required(ErrorMessage = "Senha é obrigatória")]
    public required string Password { get; init; }
}

public record GoogleAuthResponse
{
    [JsonPropertyName("status")]
    public required string Status { get; init; }

    [JsonPropertyName("user")]
    public UserDto? User { get; init; }

    [JsonPropertyName("token")]
    public string? Token { get; init; }

    [JsonPropertyName("email")]
    public string? Email { get; init; }

    public static GoogleAuthResponse Authenticated(UserDto user, string token) =>
        new() { Status = "authenticated", User = user, Token = token };

    public static GoogleAuthResponse NeedsLinking(string email) =>
        new() { Status = "needs_linking", Email = email };
}

public record GoogleUserInfo
{
    [System.Text.Json.Serialization.JsonPropertyName("sub")]
    public string Sub { get; init; } = "";

    [System.Text.Json.Serialization.JsonPropertyName("email")]
    public string Email { get; init; } = "";

    [System.Text.Json.Serialization.JsonPropertyName("name")]
    public string? Name { get; init; }

    [System.Text.Json.Serialization.JsonPropertyName("picture")]
    public string? Picture { get; init; }
}
