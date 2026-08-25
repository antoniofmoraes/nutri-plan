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
    private const int RefreshTokenDays = 30;
    private static readonly HashSet<string> SupportedScopes = ["mcp:read", "mcp:write"];

    public async Task<OAuthClientRegistrationResponse> RegisterClientAsync(OAuthClientRegistrationRequest request)
    {
        if (request.RedirectUris.Count == 0)
            throw new ApiException("redirect_uris e obrigatorio", 400);

        if (request.TokenEndpointAuthMethod is not null && request.TokenEndpointAuthMethod != "none")
            throw new ApiException("Apenas token_endpoint_auth_method none e suportado", 400);

        if (request.GrantTypes is not null && request.GrantTypes.Any(type => type is not ("authorization_code" or "refresh_token")))
            throw new ApiException("grant_types invalido", 400);

        if (request.ResponseTypes is not null && request.ResponseTypes.Any(type => type != "code"))
            throw new ApiException("response_types invalido", 400);

        var redirectUris = request.RedirectUris
            .Select(uri => uri.Trim())
            .Where(uri => uri.Length > 0)
            .Distinct()
            .ToList();

        if (redirectUris.Count == 0 || redirectUris.Any(uri => !IsSafeRedirectUri(uri)))
            throw new ApiException("redirect_uris invalido", 400);

        var scopes = ParseScopes(request.Scope);
        if (scopes.Count == 0)
            scopes.AddRange(["mcp:read", "mcp:write"]);

        if (scopes.Any(scope => !SupportedScopes.Contains(scope)))
            throw new ApiException("Escopo OAuth invalido", 400);
        if (scopes.Contains("mcp:write") && !scopes.Contains("mcp:read"))
            scopes.Insert(0, "mcp:read");

        var client = new OAuthClient
        {
            ClientId = $"mcp_{GenerateToken()}",
            Name = string.IsNullOrWhiteSpace(request.ClientName) ? "Cliente MCP" : request.ClientName.Trim(),
            RedirectUris = string.Join('\n', redirectUris),
            AllowedScopes = string.Join(' ', scopes)
        };

        db.OAuthClients.Add(client);
        await db.SaveChangesAsync();

        return new OAuthClientRegistrationResponse(
            client.ClientId,
            client.Name,
            redirectUris,
            client.AllowedScopes,
            ["authorization_code", "refresh_token"],
            ["code"],
            "none");
    }

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

    public Task<OAuthTokenResponse> ExchangeCodeAsync(IFormCollection form)
    {
        var grantType = form["grant_type"].ToString();
        return grantType switch
        {
            "authorization_code" => ExchangeAuthorizationCodeAsync(form),
            "refresh_token" => RefreshAsync(form),
            _ => throw new ApiException("grant_type invalido", 400),
        };
    }

    private async Task<OAuthTokenResponse> ExchangeAuthorizationCodeAsync(IFormCollection form)
    {
        var code = form["code"].ToString();
        var redirectUri = form["redirect_uri"].ToString();
        var clientId = form["client_id"].ToString();
        var codeVerifier = form["code_verifier"].ToString();

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

        return await IssueTokenPairAsync(client.ClientId, authorizationCode.UserId, authorizationCode.Scope);
    }

    private async Task<OAuthTokenResponse> RefreshAsync(IFormCollection form)
    {
        var refreshToken = form["refresh_token"].ToString();
        var clientId = form["client_id"].ToString();

        if (string.IsNullOrWhiteSpace(refreshToken) || string.IsNullOrWhiteSpace(clientId))
            throw new ApiException("Parametros OAuth obrigatorios", 400);

        var refreshHash = HashSecret(refreshToken);
        var current = await db.OAuthAccessTokens
            .FirstOrDefaultAsync(t => t.RefreshTokenHash == refreshHash);

        if (current is null || current.RevokedAt is not null
            || current.RefreshExpiresAt is null || current.RefreshExpiresAt <= DateTime.UtcNow)
            throw new ApiException("Refresh token invalido ou expirado", 400);
        if (current.ClientId != clientId)
            throw new ApiException("Refresh token invalido", 400);

        // Rotação: a linha antiga morre junto com o access token que ela renovava, então
        // reapresentar o mesmo refresh não devolve nada.
        current.RevokedAt = DateTime.UtcNow;

        return await IssueTokenPairAsync(current.ClientId, current.UserId, current.Scope);
    }

    private async Task<OAuthTokenResponse> IssueTokenPairAsync(string clientId, Guid userId, string scope)
    {
        var token = GenerateToken();
        var refreshToken = GenerateToken();

        db.OAuthAccessTokens.Add(new OAuthAccessToken
        {
            TokenHash = HashSecret(token),
            ClientId = clientId,
            UserId = userId,
            Scope = scope,
            ExpiresAt = DateTime.UtcNow.AddSeconds(AccessTokenSeconds),
            RefreshTokenHash = HashSecret(refreshToken),
            RefreshExpiresAt = DateTime.UtcNow.AddDays(RefreshTokenDays)
        });

        await db.SaveChangesAsync();

        return new OAuthTokenResponse(token, "Bearer", AccessTokenSeconds, scope, refreshToken);
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

        // O cliente pode revogar o access ou o refresh (RFC 7009); os dois vivem na mesma
        // linha, então revogar por qualquer um dos dois derruba o par inteiro.
        var tokenHash = HashSecret(tokenValue);
        var token = await db.OAuthAccessTokens
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash || t.RefreshTokenHash == tokenHash);
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

    private static bool IsSafeRedirectUri(string redirectUri)
    {
        if (!Uri.TryCreate(redirectUri, UriKind.Absolute, out var uri))
            return false;

        if (uri.Scheme == Uri.UriSchemeHttps)
            return true;

        return uri.Scheme == Uri.UriSchemeHttp
            && (uri.IsLoopback || uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase));
    }

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
