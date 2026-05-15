using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NutriPlan.Api.Models;

[Table("foods")]
public class Food
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("name")]
    public required string Name { get; set; }

    [Column("calories")]
    public double Calories { get; set; }

    [Column("protein")]
    public double Protein { get; set; }

    [Column("carbs")]
    public double Carbs { get; set; }

    [Column("fat")]
    public double Fat { get; set; }

    [Column("fibers")]
    public double Fibers { get; set; }

    [Column("portion")]
    public string Portion { get; set; } = "100g";

    public ICollection<MealFood> MealFoods { get; set; } = [];
    public ICollection<PresetMealFood> PresetMealFoods { get; set; } = [];
}
