using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace NutriPlan.Api.Models;

[Table("day_plans")]
public class DayPlan
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("day")]
    public required string Day { get; set; }

    [Column("mealPlanId")]
    public Guid MealPlanId { get; set; }

    [JsonIgnore]
    public MealPlan MealPlan { get; set; } = null!;

    public ICollection<Meal> Meals { get; set; } = [];
}
