using Microsoft.EntityFrameworkCore;
using NutriPlan.Api.Data;
using NutriPlan.Api.DTOs;
using NutriPlan.Api.Middleware;
using NutriPlan.Api.Models;

namespace NutriPlan.Api.Services;

public class MealPlanService(AppDbContext db)
{
    private static readonly string[] WeekDays = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];

    public async Task<List<MealPlanResponse>> GetAllByUserAsync(Guid userId)
    {
        var plans = await GetPlansQuery()
            .Where(mp => mp.UserId == userId)
            .OrderByDescending(mp => mp.CreatedAt)
            .ToListAsync();

        return plans.Select(ToResponse).ToList();
    }

    public async Task<MealPlanResponse> GetByIdAsync(Guid id, Guid userId)
    {
        var plan = await GetPlansQuery().FirstOrDefaultAsync(mp => mp.Id == id);
        if (plan is null)
            throw new ApiException("Plano alimentar não encontrado", 404);
        if (plan.UserId != userId)
            throw new ApiException("Acesso negado", 403);

        return ToResponse(plan);
    }

    public async Task<MealPlanResponse> CreateAsync(Guid userId, CreateMealPlanRequest request)
    {
        var plan = new MealPlan
        {
            Name = request.Name,
            Goal = request.Goal,
            DailyCalories = request.DailyCalories,
            DailyProtein = request.DailyProtein,
            DailyCarbs = request.DailyCarbs,
            DailyFat = request.DailyFat,
            UserId = userId,
            Days = WeekDays.Select(d => new DayPlan { Day = d }).ToList()
        };

        db.MealPlans.Add(plan);
        await db.SaveChangesAsync();

        var created = await GetPlansQuery().FirstAsync(mp => mp.Id == plan.Id);
        return ToResponse(created);
    }

    public async Task<MealPlanResponse> UpdateAsync(Guid id, Guid userId, UpdateMealPlanRequest request)
    {
        var plan = await GetPlansQuery().FirstOrDefaultAsync(mp => mp.Id == id);
        if (plan is null)
            throw new ApiException("Plano alimentar não encontrado", 404);
        if (plan.UserId != userId)
            throw new ApiException("Acesso negado", 403);

        if (request.Name is not null) plan.Name = request.Name;
        if (request.Goal is not null) plan.Goal = request.Goal;
        if (request.DailyCalories.HasValue) plan.DailyCalories = request.DailyCalories.Value;
        if (request.DailyProtein.HasValue) plan.DailyProtein = request.DailyProtein;
        if (request.DailyCarbs.HasValue) plan.DailyCarbs = request.DailyCarbs;
        if (request.DailyFat.HasValue) plan.DailyFat = request.DailyFat;

        await db.SaveChangesAsync();
        return ToResponse(plan);
    }

    public async Task DeleteAsync(Guid id, Guid userId)
    {
        var plan = await db.MealPlans.FindAsync(id);
        if (plan is null)
            throw new ApiException("Plano alimentar não encontrado", 404);
        if (plan.UserId != userId)
            throw new ApiException("Acesso negado", 403);

        db.MealPlans.Remove(plan);
        await db.SaveChangesAsync();
    }

    private IQueryable<MealPlan> GetPlansQuery() =>
        db.MealPlans
            .Include(mp => mp.Days.OrderBy(d => d.Day))
                .ThenInclude(d => d.Meals)
                    .ThenInclude(m => m.Foods)
                        .ThenInclude(mf => mf.Food);

    public static MealPlanResponse ToResponse(MealPlan plan) =>
        new(
            plan.Id,
            plan.Name,
            plan.Goal,
            plan.DailyCalories,
            plan.DailyProtein,
            plan.DailyCarbs,
            plan.DailyFat,
            plan.Days.Select(d => new DayPlanResponse(
                d.Day,
                d.Meals.Select(m => new MealResponse(
                    m.Id,
                    m.Name,
                    m.Time,
                    m.Foods.Select(mf => new MealFoodResponse(
                        mf.Id,
                        mf.Quantity,
                        new FoodResponse(mf.Food.Id, mf.Food.Name, mf.Food.Calories, mf.Food.Protein, mf.Food.Carbs, mf.Food.Fat, mf.Food.Portion)
                    )).ToList()
                )).ToList()
            )).ToList(),
            plan.CreatedAt,
            plan.UpdatedAt
        );
}
