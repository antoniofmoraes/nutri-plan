using Microsoft.EntityFrameworkCore;
using NutriPlan.Api.Data;
using NutriPlan.Api.DTOs;
using NutriPlan.Api.Middleware;
using NutriPlan.Api.Models;

namespace NutriPlan.Api.Services;

public class MealService(AppDbContext db)
{
    private static readonly string[] ValidDays = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];

    public async Task<List<MealResponse>> GetMealsForDayAsync(Guid planId, string day, Guid userId)
    {
        ValidateDay(day);
        await EnsurePlanAccess(planId, userId);

        var dayPlan = await db.DayPlans
            .Include(dp => dp.Meals)
                .ThenInclude(m => m.Foods)
                    .ThenInclude(mf => mf.Food)
            .FirstOrDefaultAsync(dp => dp.MealPlanId == planId && dp.Day == day);

        if (dayPlan is null)
            throw new ApiException("Dia não encontrado", 404);

        return dayPlan.Meals.Select(ToMealResponse).ToList();
    }

    public async Task<MealResponse> CreateMealAsync(Guid planId, string day, Guid userId, CreateMealRequest request)
    {
        ValidateDay(day);
        await EnsurePlanAccess(planId, userId);

        var dayPlan = await db.DayPlans
            .FirstOrDefaultAsync(dp => dp.MealPlanId == planId && dp.Day == day);

        if (dayPlan is null)
            throw new ApiException("Dia não encontrado", 404);

        var meal = new Meal
        {
            Name = request.Name,
            Time = request.Time,
            DayPlanId = dayPlan.Id
        };

        db.Meals.Add(meal);
        await db.SaveChangesAsync();

        return new MealResponse(meal.Id, meal.Name, meal.Time, []);
    }

    public async Task<MealResponse> UpdateMealAsync(Guid mealId, Guid userId, UpdateMealRequest request)
    {
        var meal = await db.Meals
            .Include(m => m.Foods).ThenInclude(mf => mf.Food)
            .Include(m => m.DayPlan).ThenInclude(dp => dp.MealPlan)
            .FirstOrDefaultAsync(m => m.Id == mealId);

        if (meal is null)
            throw new ApiException("Refeição não encontrada", 404);
        if (meal.DayPlan.MealPlan.UserId != userId)
            throw new ApiException("Acesso negado", 403);

        if (request.Name is not null) meal.Name = request.Name;
        if (request.Time is not null) meal.Time = request.Time;

        await db.SaveChangesAsync();
        return ToMealResponse(meal);
    }

    public async Task DeleteMealAsync(Guid mealId, Guid userId)
    {
        var meal = await db.Meals
            .Include(m => m.DayPlan).ThenInclude(dp => dp.MealPlan)
            .FirstOrDefaultAsync(m => m.Id == mealId);

        if (meal is null)
            throw new ApiException("Refeição não encontrada", 404);
        if (meal.DayPlan.MealPlan.UserId != userId)
            throw new ApiException("Acesso negado", 403);

        db.Meals.Remove(meal);
        await db.SaveChangesAsync();
    }

    private async Task EnsurePlanAccess(Guid planId, Guid userId)
    {
        var plan = await db.MealPlans.FindAsync(planId);
        if (plan is null)
            throw new ApiException("Plano alimentar não encontrado", 404);
        if (plan.UserId != userId)
            throw new ApiException("Acesso negado", 403);
    }

    private static void ValidateDay(string day)
    {
        if (!ValidDays.Contains(day))
            throw new ApiException("Dia inválido", 400);
    }

    private static MealResponse ToMealResponse(Meal m) =>
        new(m.Id, m.Name, m.Time, m.Foods.Select(mf =>
            new MealFoodResponse(mf.Id, mf.Quantity,
                new FoodResponse(mf.Food.Id, mf.Food.Name, mf.Food.Calories, mf.Food.Protein, mf.Food.Carbs, mf.Food.Fat, mf.Food.Fibers, mf.Food.Portion)
            )).ToList());
}
