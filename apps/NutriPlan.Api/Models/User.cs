using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NutriPlan.Api.Models;

[Table("users")]
public class User
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("name")]
    public required string Name { get; set; }

    [Column("email")]
    public required string Email { get; set; }

    [Column("password")]
    public string? Password { get; set; }

    [Column("googleId")]
    public string? GoogleId { get; set; }

    [Column("isAdmin")]
    public bool IsAdmin { get; set; } = false;

    [Column("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("mainMealPlanId")]
    public Guid? MainMealPlanId { get; set; }

    public MealPlan? MainMealPlan { get; set; }

    public ICollection<MealPlan> MealPlans { get; set; } = [];
    public ICollection<MealPlan> SharedMealPlans { get; set; } = [];
    public ICollection<PresetMeal> PresetMeals { get; set; } = [];
}
