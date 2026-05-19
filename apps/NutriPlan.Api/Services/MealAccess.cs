using Microsoft.EntityFrameworkCore;
using NutriPlan.Api.Data;
using NutriPlan.Api.Middleware;
using NutriPlan.Api.Models;

namespace NutriPlan.Api.Services;

public static class MealAccess
{
    public static IQueryable<Meal> WithOwnership(this IQueryable<Meal> query) =>
        query.Include(m => m.DayPlan).ThenInclude(dp => dp.MealPlan);

    public static void AssertOwnership(this Meal meal, Guid userId)
    {
        if (meal.DayPlan.MealPlan.UserId != userId)
            throw new ApiException("Acesso negado", 403);
    }

    public static void ReplaceFoods(this AppDbContext db, Meal target, IEnumerable<(Guid FoodId, double Quantity)> source)
    {
        db.MealFoods.RemoveRange(target.Foods);
        target.IsCheat = false;
        foreach (var (foodId, quantity) in source)
        {
            db.MealFoods.Add(new MealFood
            {
                MealId = target.Id,
                FoodId = foodId,
                Quantity = quantity
            });
        }
    }
}
