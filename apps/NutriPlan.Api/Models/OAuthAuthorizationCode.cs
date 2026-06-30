using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace NutriPlan.Api.Models;

[Table("oauth_authorization_codes")]
public class OAuthAuthorizationCode
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("codeHash")]
    public required string CodeHash { get; set; }

    [Column("clientId")]
    public required string ClientId { get; set; }

    [Column("userId")]
    public Guid UserId { get; set; }

    [JsonIgnore]
    public User User { get; set; } = null!;

    [Column("redirectUri")]
    public required string RedirectUri { get; set; }

    [Column("scope")]
    public required string Scope { get; set; }

    [Column("codeChallenge")]
    public required string CodeChallenge { get; set; }

    [Column("codeChallengeMethod")]
    public required string CodeChallengeMethod { get; set; }

    [Column("expiresAt")]
    public DateTime ExpiresAt { get; set; }

    [Column("usedAt")]
    public DateTime? UsedAt { get; set; }

    [Column("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
