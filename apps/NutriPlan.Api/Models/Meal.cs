using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace NutriPlan.Api.Models;

[Table("meals")]
public class Meal
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("mealSlotId")]
    public Guid MealSlotId { get; set; }

    [JsonIgnore]
    public MealSlot MealSlot { get; set; } = null!;

    [Column("dayPlanId")]
    public Guid DayPlanId { get; set; }

    [JsonIgnore]
    public DayPlan DayPlan { get; set; } = null!;

    public ICollection<MealFood> Foods { get; set; } = [];
}
