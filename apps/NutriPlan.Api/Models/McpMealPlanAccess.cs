using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace NutriPlan.Api.Models;

[Table("mcp_meal_plan_accesses")]
public class McpMealPlanAccess
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("userId")]
    public Guid UserId { get; set; }

    [JsonIgnore]
    public User User { get; set; } = null!;

    [Column("mealPlanId")]
    public Guid MealPlanId { get; set; }

    [JsonIgnore]
    public MealPlan MealPlan { get; set; } = null!;

    [Column("canRead")]
    public bool CanRead { get; set; } = true;

    [Column("canEdit")]
    public bool CanEdit { get; set; } = false;

    [Column("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
