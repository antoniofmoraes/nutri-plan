using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NutriPlan.Api.Models;

[Table("oauth_clients")]
public class OAuthClient
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("clientId")]
    public required string ClientId { get; set; }

    [Column("name")]
    public required string Name { get; set; }

    [Column("redirectUris")]
    public required string RedirectUris { get; set; }

    [Column("allowedScopes")]
    public required string AllowedScopes { get; set; } = "mcp:read mcp:write";

    [Column("isEnabled")]
    public bool IsEnabled { get; set; } = true;

    [Column("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
