using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NutriPlan.Api.Models;

[Table("undo_entries")]
public class UndoEntry
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("userId")]
    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    [Column("kind")]
    public required string Kind { get; set; }

    [Column("snapshot", TypeName = "jsonb")]
    public required string Snapshot { get; set; }

    // Impressão do estado logo APÓS a mutação. Se o estado atual não bater com ela,
    // algo mais novo aconteceu e o undo é rejeitado em vez de sobrescrever.
    [Column("fingerprint")]
    public required string Fingerprint { get; set; }

    [Column("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("expiresAt")]
    public DateTime ExpiresAt { get; set; }

    [Column("consumedAt")]
    public DateTime? ConsumedAt { get; set; }
}
