using Microsoft.EntityFrameworkCore;
using NutriPlan.Api.Models;

namespace NutriPlan.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Foods.AnyAsync())
            return;

        db.Foods.AddRange(
            new Food { Name = "Frango Grelhado", Calories = 165, Protein = 31, Carbs = 0, Fat = 3.6, Portion = "100g" },
            new Food { Name = "Arroz Branco", Calories = 130, Protein = 2.7, Carbs = 28, Fat = 0.3, Portion = "100g" },
            new Food { Name = "Feijão Preto", Calories = 132, Protein = 8.9, Carbs = 23.7, Fat = 0.5, Portion = "100g" },
            new Food { Name = "Ovo Cozido", Calories = 155, Protein = 13, Carbs = 1.1, Fat = 11, Portion = "100g" },
            new Food { Name = "Banana", Calories = 89, Protein = 1.1, Carbs = 23, Fat = 0.3, Portion = "100g" },
            new Food { Name = "Aveia", Calories = 389, Protein = 16.9, Carbs = 66, Fat = 6.9, Portion = "100g" },
            new Food { Name = "Batata Doce", Calories = 86, Protein = 1.6, Carbs = 20, Fat = 0.1, Portion = "100g" },
            new Food { Name = "Peito de Peru", Calories = 104, Protein = 17.1, Carbs = 4.2, Fat = 1.7, Portion = "100g" },
            new Food { Name = "Iogurte Natural", Calories = 59, Protein = 3.5, Carbs = 4.7, Fat = 3.3, Portion = "100g" },
            new Food { Name = "Whey Protein", Calories = 120, Protein = 24, Carbs = 3, Fat = 1, Portion = "30g" }
        );

        await db.SaveChangesAsync();
    }
}
