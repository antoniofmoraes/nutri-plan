using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace NutriPlan.Api.Models;

[Table("oauth_access_tokens")]
public class OAuthAccessToken
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("tokenHash")]
    public required string TokenHash { get; set; }

    [Column("clientId")]
    public required string ClientId { get; set; }

    [Column("userId")]
    public Guid UserId { get; set; }

    [JsonIgnore]
    public User User { get; set; } = null!;

    [Column("scope")]
    public required string Scope { get; set; }

    [Column("expiresAt")]
    public DateTime ExpiresAt { get; set; }

    [Column("revokedAt")]
    public DateTime? RevokedAt { get; set; }

    [Column("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
