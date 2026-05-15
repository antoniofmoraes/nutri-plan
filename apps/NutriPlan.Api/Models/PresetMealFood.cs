using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace NutriPlan.Api.Models;

[Table("preset_meal_foods")]
public class PresetMealFood
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("quantity")]
    public double Quantity { get; set; } = 100;

    [Column("presetMealId")]
    public Guid PresetMealId { get; set; }

    [JsonIgnore]
    public PresetMeal PresetMeal { get; set; } = null!;

    [Column("foodId")]
    public Guid FoodId { get; set; }

    public Food Food { get; set; } = null!;
}
