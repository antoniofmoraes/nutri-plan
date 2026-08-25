using Microsoft.EntityFrameworkCore;
using NutriPlan.Api.Data;
using NutriPlan.Api.DTOs;
using NutriPlan.Api.Middleware;
using NutriPlan.Api.Models;

namespace NutriPlan.Api.Services;

public class MealService(AppDbContext db, UndoService undo)
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

    public async Task CopyToAsync(Guid sourceMealId, Guid userId, List<Guid> targetMealIds)
    {
        if (targetMealIds.Count == 0) return;

        var source = await db.Meals
            .WithOwnership()
            .Include(m => m.Foods)
            .FirstOrDefaultAsync(m => m.Id == sourceMealId);

        if (source is null)
            throw new ApiException("Refeição de origem não encontrada", 404);
        source.AssertEditAccess(userId);

        var targets = await db.Meals
            .WithOwnership()
            .Include(m => m.Foods)
            .Where(m => targetMealIds.Contains(m.Id))
            .ToListAsync();

        var sourceItems = source.Foods.Select(sf => (sf.FoodId, sf.Quantity)).ToList();

        var before = await undo.CaptureMealsAsync(targets.Select(t => t.Id));

        foreach (var target in targets)
        {
            target.AssertEditAccess(userId);
            if (target.MealSlotId != source.MealSlotId)
                throw new ApiException("Só é possível copiar entre o mesmo tipo de refeição", 400);
            if (target.Id == source.Id)
                continue;

            db.ReplaceFoods(target, sourceItems);
        }

        await db.SaveChangesAsync();
        await undo.RecordAsync(userId, before);
    }

    public async Task<MealResponse> SetCheatAsync(Guid mealId, Guid userId, bool isCheat)
    {
        var meal = await db.Meals
            .WithOwnership()
            .Include(m => m.MealSlot)
            .Include(m => m.Foods).ThenInclude(mf => mf.Food)
            .FirstOrDefaultAsync(m => m.Id == mealId);

        if (meal is null)
            throw new ApiException("Refeição não encontrada", 404);
        meal.AssertEditAccess(userId);

        if (isCheat)
        {
            // Ensure at least one other instance of this slot remains non-cheat
            var otherNonCheatCount = await db.Meals
                .CountAsync(m =>
                    m.MealSlotId == meal.MealSlotId
                    && m.DayPlan.MealPlanId == meal.DayPlan.MealPlanId
                    && m.Id != meal.Id
                    && !m.IsCheat);

            if (otherNonCheatCount == 0)
                throw new ApiException("Pelo menos um dia dessa refeição precisa ter alimentos cadastrados (não pode marcar todos como livre)", 400);
        }

        var before = await undo.CaptureMealsAsync([mealId]);

        meal.IsCheat = isCheat;
        await db.SaveChangesAsync();
        await undo.RecordAsync(userId, before);
        return ToMealResponse(meal);
    }

    private async Task EnsurePlanAccess(Guid planId, Guid userId)
    {
        var plan = await db.MealPlans
            .Where(mp => mp.Id == planId)
            .Select(mp => new { mp.UserId, mp.SharedWithUserId })
            .FirstOrDefaultAsync();

        if (plan is null)
            throw new ApiException("Plano alimentar não encontrado", 404);
        if (plan.UserId != userId && plan.SharedWithUserId != userId)
            throw new ApiException("Acesso negado", 403);
    }

    private static void ValidateDay(string day)
    {
        if (!MealPlanService.WeekDays.Contains(day))
            throw new ApiException("Dia inválido", 400);
    }

    private static MealResponse ToMealResponse(Meal m) =>
        new(m.Id, m.MealSlotId, m.MealSlot.Name, m.MealSlot.Time, m.IsCheat, m.Foods.Select(mf =>
            new MealFoodResponse(mf.Id, mf.Quantity,
                new FoodResponse(mf.Food.Id, mf.Food.Name, mf.Food.Calories, mf.Food.Protein, mf.Food.Carbs, mf.Food.Fat, mf.Food.Fibers, mf.Food.Portion)
            )).ToList());
}
