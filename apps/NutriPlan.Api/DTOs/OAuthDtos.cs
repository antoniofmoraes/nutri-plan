using System.Text.Json.Serialization;

namespace NutriPlan.Api.DTOs;

public record OAuthAuthorizePreviewResponse(
    string ClientId,
    string ClientName,
    string RedirectUri,
    List<string> Scopes,
    string? State
);

public record OAuthAuthorizeConfirmRequest(
    string ResponseType,
    string ClientId,
    string RedirectUri,
    string Scope,
    string? State,
    string CodeChallenge,
    string CodeChallengeMethod
);

public record OAuthAuthorizeConfirmResponse(string RedirectUrl);

public record OAuthTokenResponse(
    [property: JsonPropertyName("access_token")] string AccessToken,
    [property: JsonPropertyName("token_type")] string TokenType,
    [property: JsonPropertyName("expires_in")] int ExpiresIn,
    [property: JsonPropertyName("scope")] string Scope
);

public record OAuthTokenValidation(Guid UserId, string ClientId, List<string> Scopes);
