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

public record OAuthClientRegistrationRequest(
    [property: JsonPropertyName("redirect_uris")] List<string> RedirectUris,
    [property: JsonPropertyName("client_name")] string? ClientName,
    [property: JsonPropertyName("scope")] string? Scope,
    [property: JsonPropertyName("grant_types")] List<string>? GrantTypes,
    [property: JsonPropertyName("response_types")] List<string>? ResponseTypes,
    [property: JsonPropertyName("token_endpoint_auth_method")] string? TokenEndpointAuthMethod
);

public record OAuthClientRegistrationResponse(
    [property: JsonPropertyName("client_id")] string ClientId,
    [property: JsonPropertyName("client_name")] string ClientName,
    [property: JsonPropertyName("redirect_uris")] List<string> RedirectUris,
    [property: JsonPropertyName("scope")] string Scope,
    [property: JsonPropertyName("grant_types")] List<string> GrantTypes,
    [property: JsonPropertyName("response_types")] List<string> ResponseTypes,
    [property: JsonPropertyName("token_endpoint_auth_method")] string TokenEndpointAuthMethod
);

public record OAuthTokenResponse(
    [property: JsonPropertyName("access_token")] string AccessToken,
    [property: JsonPropertyName("token_type")] string TokenType,
    [property: JsonPropertyName("expires_in")] int ExpiresIn,
    [property: JsonPropertyName("scope")] string Scope,
    [property: JsonPropertyName("refresh_token")] string? RefreshToken = null
);

public record OAuthTokenValidation(Guid UserId, string ClientId, List<string> Scopes);
