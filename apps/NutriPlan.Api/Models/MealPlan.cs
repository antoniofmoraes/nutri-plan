using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace NutriPlan.Api.Models;

[Table("meal_plans")]
public class MealPlan
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("name")]
    public required string Name { get; set; }

    [Column("goal")]
    public required string Goal { get; set; }

    [Column("dailyCalories")]
    public int DailyCalories { get; set; }

    [Column("dailyProtein")]
    public int? DailyProtein { get; set; }

    [Column("dailyCarbs")]
    public int? DailyCarbs { get; set; }

    [Column("dailyFat")]
    public int? DailyFat { get; set; }

    [Column("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("userId")]
    public Guid UserId { get; set; }

    [JsonIgnore]
    public User User { get; set; } = null!;

    public ICollection<DayPlan> Days { get; set; } = [];
    public ICollection<MealSlot> Slots { get; set; } = [];
}
