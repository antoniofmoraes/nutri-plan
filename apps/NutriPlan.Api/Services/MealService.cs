using Microsoft.EntityFrameworkCore;
using NutriPlan.Api.Data;
using NutriPlan.Api.DTOs;
using NutriPlan.Api.Middleware;
using NutriPlan.Api.Models;

namespace NutriPlan.Api.Services;

public class MealService(AppDbContext db)
{
    public async Task<List<MealResponse>> GetMealsForDayAsync(Guid planId, string day, Guid userId)
    {
        ValidateDay(day);
        await EnsurePlanAccess(planId, userId);

        var dayPlan = await db.DayPlans
            .Include(dp => dp.Meals).ThenInclude(m => m.MealSlot)
            .Include(dp => dp.Meals).ThenInclude(m => m.Foods).ThenInclude(mf => mf.Food)
            .FirstOrDefaultAsync(dp => dp.MealPlanId == planId && dp.Day == day);

        if (dayPlan is null)
            throw new ApiException("Dia não encontrado", 404);

        return dayPlan.Meals
            .OrderBy(m => m.MealSlot.SortOrder)
            .Select(ToMealResponse)
            .ToList();
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
        if (!MealPlanService.WeekDays.Contains(day))
            throw new ApiException("Dia inválido", 400);
    }

    private static MealResponse ToMealResponse(Meal m) =>
        new(m.Id, m.MealSlotId, m.MealSlot.Name, m.MealSlot.Time, m.Foods.Select(mf =>
            new MealFoodResponse(mf.Id, mf.Quantity,
                new FoodResponse(mf.Food.Id, mf.Food.Name, mf.Food.Calories, mf.Food.Protein, mf.Food.Carbs, mf.Food.Fat, mf.Food.Fibers, mf.Food.Portion)
            )).ToList());
}
