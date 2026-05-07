using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace NutriPlan.Api.Models;

[Table("meal_foods")]
public class MealFood
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("quantity")]
    public double Quantity { get; set; } = 100;

    [Column("mealId")]
    public Guid MealId { get; set; }

    [JsonIgnore]
    public Meal Meal { get; set; } = null!;

    [Column("foodId")]
    public Guid FoodId { get; set; }

    public Food Food { get; set; } = null!;
}
