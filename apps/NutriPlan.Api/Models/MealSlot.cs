using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace NutriPlan.Api.Models;

[Table("meal_slots")]
public class MealSlot
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("name")]
    public required string Name { get; set; }

    [Column("time")]
    public string? Time { get; set; }

    [Column("sortOrder")]
    public int SortOrder { get; set; }

    [Column("mealPlanId")]
    public Guid MealPlanId { get; set; }

    [JsonIgnore]
    public MealPlan MealPlan { get; set; } = null!;

    public ICollection<Meal> Meals { get; set; } = [];
}
