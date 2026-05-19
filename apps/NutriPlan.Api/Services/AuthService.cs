using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NutriPlan.Api.Data;
using NutriPlan.Api.DTOs;
using NutriPlan.Api.Middleware;
using NutriPlan.Api.Models;

namespace NutriPlan.Api.Services;

public class AuthService(AppDbContext db, IConfiguration config)
{
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var exists = await db.Users.AnyAsync(u => u.Email == request.Email);
        if (exists)
            throw new ApiException("Email já cadastrado", 409);

        var user = new User
        {
            Name = request.Name,
            Email = request.Email,
            Password = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        var token = GenerateToken(user);
        return new AuthResponse(new UserDto(user.Id, user.Name, user.Email, user.MainMealPlanId), token);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
            throw new ApiException("Credenciais inválidas", 401);

        var token = GenerateToken(user);
        return new AuthResponse(new UserDto(user.Id, user.Name, user.Email, user.MainMealPlanId), token);
    }

    public async Task<UserWithDateDto> GetMeAsync(Guid userId)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null)
            throw new ApiException("Usuário não encontrado", 404);

        return new UserWithDateDto(user.Id, user.Name, user.Email, user.MainMealPlanId, user.CreatedAt);
    }

    private string GenerateToken(User user)
    {
        var secret = config["JWT_SECRET"] ?? config["Jwt:Secret"]
            ?? throw new InvalidOperationException("JWT_SECRET não configurado");
        var expiresIn = config["JWT_EXPIRES_IN"] ?? config["Jwt:ExpiresIn"] ?? "7d";
        var issuer = config["JWT_ISSUER"] ?? "nutriplan-api";
        var audience = config["JWT_AUDIENCE"] ?? "nutriplan-app";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim("userId", user.Id.ToString()),
            new Claim("email", user.Email),
            new Claim("isAdmin", user.IsAdmin ? "true" : "false")
        };

        var expiration = ParseExpiration(expiresIn);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.Add(expiration),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static TimeSpan ParseExpiration(string value)
    {
        if (value.EndsWith('d') && int.TryParse(value[..^1], out var days))
            return TimeSpan.FromDays(days);
        if (value.EndsWith('h') && int.TryParse(value[..^1], out var hours))
            return TimeSpan.FromHours(hours);
        throw new InvalidOperationException($"JWT_EXPIRES_IN inválido: '{value}' (use formato '7d' ou '12h')");
    }
}
