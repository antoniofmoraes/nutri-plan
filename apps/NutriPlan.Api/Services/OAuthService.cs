using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using NutriPlan.Api.Data;
using NutriPlan.Api.DTOs;
using NutriPlan.Api.Middleware;
using NutriPlan.Api.Models;

namespace NutriPlan.Api.Services;

public class OAuthService(AppDbContext db)
{
    private const int AuthorizationCodeMinutes = 10;
    private const int AccessTokenSeconds = 3600;
    private static readonly HashSet<string> SupportedScopes = ["mcp:read", "mcp:write"];

    public async Task<OAuthAuthorizePreviewResponse> PreviewAuthorizeAsync(
        string? responseType,
        string? clientId,
        string? redirectUri,
        string? scope,
        string? state,
        string? codeChallenge,
        string? codeChallengeMethod)
    {
        var request = await ValidateAuthorizeRequestAsync(
            responseType,
            clientId,
            redirectUri,
            scope,
            state,
            codeChallenge,
            codeChallengeMethod);

        return new OAuthAuthorizePreviewResponse(
            request.Client.ClientId,
            request.Client.Name,
            request.RedirectUri,
            request.Scopes,
            state);
    }

    public async Task<OAuthAuthorizeConfirmResponse> ConfirmAuthorizeAsync(Guid userId, OAuthAuthorizeConfirmRequest request)
    {
        var validated = await ValidateAuthorizeRequestAsync(
            request.ResponseType,
            request.ClientId,
            request.RedirectUri,
            request.Scope,
            request.State,
            request.CodeChallenge,
            request.CodeChallengeMethod);

        var code = GenerateToken();
        db.OAuthAuthorizationCodes.Add(new OAuthAuthorizationCode
        {
            CodeHash = HashSecret(code),
            ClientId = validated.Client.ClientId,
            UserId = userId,
            RedirectUri = validated.RedirectUri,
            Scope = string.Join(' ', validated.Scopes),
            CodeChallenge = request.CodeChallenge,
            CodeChallengeMethod = request.CodeChallengeMethod,
            ExpiresAt = DateTime.UtcNow.AddMinutes(AuthorizationCodeMinutes)
        });

        await db.SaveChangesAsync();

        var query = new Dictionary<string, string?>
        {
            ["code"] = code,
            ["state"] = request.State
        };

        return new OAuthAuthorizeConfirmResponse(QueryHelpers.AddQueryString(validated.RedirectUri, query));
    }

    public async Task<OAuthTokenResponse> ExchangeCodeAsync(IFormCollection form)
    {
        var grantType = form["grant_type"].ToString();
        var code = form["code"].ToString();
        var redirectUri = form["redirect_uri"].ToString();
        var clientId = form["client_id"].ToString();
        var codeVerifier = form["code_verifier"].ToString();

        if (grantType != "authorization_code")
            throw new ApiException("grant_type invalido", 400);
        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(redirectUri) || string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(codeVerifier))
            throw new ApiException("Parametros OAuth obrigatorios", 400);

        var codeHash = HashSecret(code);
        var authorizationCode = await db.OAuthAuthorizationCodes
            .FirstOrDefaultAsync(c => c.CodeHash == codeHash);

        if (authorizationCode is null || authorizationCode.UsedAt is not null || authorizationCode.ExpiresAt <= DateTime.UtcNow)
            throw new ApiException("Codigo OAuth invalido ou expirado", 400);
        if (authorizationCode.ClientId != clientId || authorizationCode.RedirectUri != redirectUri)
            throw new ApiException("Codigo OAuth invalido", 400);
        if (!ValidatePkce(authorizationCode.CodeChallenge, authorizationCode.CodeChallengeMethod, codeVerifier))
            throw new ApiException("PKCE invalido", 400);

        var client = await LoadClientAsync(clientId);
        if (!IsRedirectUriAllowed(client, redirectUri))
            throw new ApiException("redirect_uri nao autorizado", 400);

        authorizationCode.UsedAt = DateTime.UtcNow;

        var token = GenerateToken();
        db.OAuthAccessTokens.Add(new OAuthAccessToken
        {
            TokenHash = HashSecret(token),
            ClientId = client.ClientId,
            UserId = authorizationCode.UserId,
            Scope = authorizationCode.Scope,
            ExpiresAt = DateTime.UtcNow.AddSeconds(AccessTokenSeconds)
        });

        await db.SaveChangesAsync();

        return new OAuthTokenResponse(token, "Bearer", AccessTokenSeconds, authorizationCode.Scope);
    }

    public async Task<OAuthTokenValidation> ValidateAccessTokenAsync(string accessToken, string requiredScope)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
            throw new ApiException("Token nao fornecido", 401);

        var tokenHash = HashSecret(accessToken);
        var token = await db.OAuthAccessTokens
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash);

        if (token is null || token.RevokedAt is not null || token.ExpiresAt <= DateTime.UtcNow)
            throw new ApiException("Token invalido ou expirado", 401);

        var scopes = ParseScopes(token.Scope);
        if (!scopes.Contains(requiredScope))
            throw new ApiException("Escopo OAuth insuficiente", 403);

        return new OAuthTokenValidation(token.UserId, token.ClientId, scopes);
    }

    public async Task RevokeAsync(IFormCollection form)
    {
        var tokenValue = form["token"].ToString();
        if (string.IsNullOrWhiteSpace(tokenValue))
            return;

        var tokenHash = HashSecret(tokenValue);
        var token = await db.OAuthAccessTokens.FirstOrDefaultAsync(t => t.TokenHash == tokenHash);
        if (token is null || token.RevokedAt is not null)
            return;

        token.RevokedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }

    private async Task<AuthorizeRequest> ValidateAuthorizeRequestAsync(
        string? responseType,
        string? clientId,
        string? redirectUri,
        string? scope,
        string? state,
        string? codeChallenge,
        string? codeChallengeMethod)
    {
        if (responseType != "code")
            throw new ApiException("response_type deve ser code", 400);
        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(redirectUri))
            throw new ApiException("client_id e redirect_uri sao obrigatorios", 400);
        if (string.IsNullOrWhiteSpace(codeChallenge) || codeChallengeMethod != "S256")
            throw new ApiException("PKCE S256 e obrigatorio", 400);

        var client = await LoadClientAsync(clientId);
        if (!IsRedirectUriAllowed(client, redirectUri))
            throw new ApiException("redirect_uri nao autorizado", 400);

        var scopes = ParseScopes(scope);
        if (scopes.Count == 0)
            scopes.Add("mcp:read");
        if (scopes.Any(s => !SupportedScopes.Contains(s)))
            throw new ApiException("Escopo OAuth invalido", 400);

        var allowedScopes = ParseScopes(client.AllowedScopes);
        if (scopes.Any(s => !allowedScopes.Contains(s)))
            throw new ApiException("Escopo OAuth nao autorizado para este cliente", 400);
        if (scopes.Contains("mcp:write") && !scopes.Contains("mcp:read"))
            scopes.Insert(0, "mcp:read");

        return new AuthorizeRequest(client, redirectUri, scopes, state);
    }

    private async Task<OAuthClient> LoadClientAsync(string clientId)
    {
        var client = await db.OAuthClients.FirstOrDefaultAsync(c => c.ClientId == clientId && c.IsEnabled);
        if (client is null)
            throw new ApiException("Cliente OAuth nao encontrado", 400);
        return client;
    }

    private static bool IsRedirectUriAllowed(OAuthClient client, string redirectUri) =>
        client.RedirectUris
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Any(uri => uri == redirectUri);

    private static List<string> ParseScopes(string? scope) =>
        (scope ?? "")
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Distinct()
            .ToList();

    private static bool ValidatePkce(string challenge, string method, string verifier)
    {
        if (method != "S256") return false;
        var bytes = SHA256.HashData(Encoding.ASCII.GetBytes(verifier));
        var computed = Base64UrlTextEncoder.Encode(bytes);
        return CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(challenge), Encoding.ASCII.GetBytes(computed));
    }

    private static string GenerateToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Base64UrlTextEncoder.Encode(bytes);
    }

    private static string HashSecret(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Base64UrlTextEncoder.Encode(bytes);
    }

    private record AuthorizeRequest(OAuthClient Client, string RedirectUri, List<string> Scopes, string? State);
}
