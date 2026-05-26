using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NutriPlan.Api.Data;
using NutriPlan.Api.DTOs;
using NutriPlan.Api.Middleware;
using NutriPlan.Api.Models;

namespace NutriPlan.Api.Services;

public class AuthService(AppDbContext db, IConfiguration config, IHttpClientFactory httpClientFactory)
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
        return new AuthResponse(new UserDto(user.Id, user.Name, user.Email, user.MainMealPlanId, user.IsAdmin), token);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user is null)
            throw new ApiException("Credenciais inválidas", 401);
        if (user.Password is null)
            throw new ApiException("Esta conta usa login com Google. Use o botão 'Entrar com Google'.", 400);
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
            throw new ApiException("Credenciais inválidas", 401);

        var token = GenerateToken(user);
        return new AuthResponse(new UserDto(user.Id, user.Name, user.Email, user.MainMealPlanId, user.IsAdmin), token);
    }

    public async Task<GoogleAuthResponse> GoogleAuthAsync(string accessToken)
    {
        var googleUser = await GetGoogleUserInfoAsync(accessToken);

        // Already linked — login directly
        var user = await db.Users.FirstOrDefaultAsync(u => u.GoogleId == googleUser.Sub);
        if (user is not null)
        {
            var token = GenerateToken(user);
            return GoogleAuthResponse.Authenticated(new UserDto(user.Id, user.Name, user.Email, user.MainMealPlanId, user.IsAdmin), token);
        }

        // Email exists but not linked — needs password confirmation
        var existingByEmail = await db.Users.FirstOrDefaultAsync(u => u.Email == googleUser.Email);
        if (existingByEmail is not null)
            return GoogleAuthResponse.NeedsLinking(googleUser.Email);

        // New user — create account
        var newUser = new User
        {
            Name = googleUser.Name ?? googleUser.Email,
            Email = googleUser.Email,
            GoogleId = googleUser.Sub
        };
        db.Users.Add(newUser);
        await db.SaveChangesAsync();

        var newToken = GenerateToken(newUser);
        return GoogleAuthResponse.Authenticated(new UserDto(newUser.Id, newUser.Name, newUser.Email, newUser.MainMealPlanId, newUser.IsAdmin), newToken);
    }

    public async Task<AuthResponse> GoogleLinkAsync(string accessToken, string password)
    {
        var googleUser = await GetGoogleUserInfoAsync(accessToken);

        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == googleUser.Email);
        if (user is null)
            throw new ApiException("Conta não encontrada", 404);

        if (user.Password is null)
            throw new ApiException("Esta conta não possui senha definida", 400);

        if (!BCrypt.Net.BCrypt.Verify(password, user.Password))
            throw new ApiException("Senha incorreta", 401);

        user.GoogleId = googleUser.Sub;
        await db.SaveChangesAsync();

        var token = GenerateToken(user);
        return new AuthResponse(new UserDto(user.Id, user.Name, user.Email, user.MainMealPlanId, user.IsAdmin), token);
    }

    public async Task<UserWithDateDto> GetMeAsync(Guid userId)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null)
            throw new ApiException("Usuário não encontrado", 404);

        return new UserWithDateDto(user.Id, user.Name, user.Email, user.MainMealPlanId, user.IsAdmin, user.CreatedAt);
    }

    private async Task<GoogleUserInfo> GetGoogleUserInfoAsync(string accessToken)
    {
        var client = httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("https://www.googleapis.com/oauth2/v3/userinfo");
        if (!response.IsSuccessStatusCode)
            throw new ApiException("Token do Google inválido", 401);

        var json = await response.Content.ReadAsStringAsync();
        var userInfo = JsonSerializer.Deserialize<GoogleUserInfo>(json)
            ?? throw new ApiException("Resposta inválida do Google", 502);

        if (string.IsNullOrEmpty(userInfo.Email))
            throw new ApiException("Não foi possível obter o email da conta Google", 400);

        return userInfo;
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
