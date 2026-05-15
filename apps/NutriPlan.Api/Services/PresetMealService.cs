using Microsoft.EntityFrameworkCore;
using NutriPlan.Api.Data;
using NutriPlan.Api.DTOs;
using NutriPlan.Api.Middleware;
using NutriPlan.Api.Models;

namespace NutriPlan.Api.Services;

public class PresetMealService(AppDbContext db)
{
    public async Task<List<PresetMealResponse>> GetAllByUserAsync(Guid userId)
    {
        var presets = await GetPresetsQuery()
            .Where(pm => pm.UserId == userId)
            .OrderByDescending(pm => pm.CreatedAt)
            .ToListAsync();

        return presets.Select(ToResponse).ToList();
    }

    public async Task<PresetMealResponse> GetByIdAsync(Guid id, Guid userId)
    {
        var preset = await GetPresetsQuery().FirstOrDefaultAsync(pm => pm.Id == id);
        if (preset is null)
            throw new ApiException("Refeição pronta não encontrada", 404);
        if (preset.UserId != userId)
            throw new ApiException("Acesso negado", 403);

        return ToResponse(preset);
    }

    public async Task<PresetMealResponse> CreateAsync(Guid userId, CreatePresetMealRequest request)
    {
        var preset = new PresetMeal
        {
            Name = request.Name,
            UserId = userId
        };

        db.PresetMeals.Add(preset);
        await db.SaveChangesAsync();

        var created = await GetPresetsQuery().FirstAsync(pm => pm.Id == preset.Id);
        return ToResponse(created);
    }

    public async Task<PresetMealResponse> UpdateAsync(Guid id, Guid userId, UpdatePresetMealRequest request)
    {
        var preset = await GetPresetsQuery().FirstOrDefaultAsync(pm => pm.Id == id);
        if (preset is null)
            throw new ApiException("Refeição pronta não encontrada", 404);
        if (preset.UserId != userId)
            throw new ApiException("Acesso negado", 403);

        if (request.Name is not null) preset.Name = request.Name;

        await db.SaveChangesAsync();
        return ToResponse(preset);
    }

    public async Task DeleteAsync(Guid id, Guid userId)
    {
        var preset = await db.PresetMeals.FindAsync(id);
        if (preset is null)
            throw new ApiException("Refeição pronta não encontrada", 404);
        if (preset.UserId != userId)
            throw new ApiException("Acesso negado", 403);

        db.PresetMeals.Remove(preset);
        await db.SaveChangesAsync();
    }

    public async Task<PresetMealFoodResponse> AddFoodAsync(Guid presetId, Guid userId, AddPresetMealFoodRequest request)
    {
        var preset = await db.PresetMeals.FindAsync(presetId);
        if (preset is null)
            throw new ApiException("Refeição pronta não encontrada", 404);
        if (preset.UserId != userId)
            throw new ApiException("Acesso negado", 403);

        var food = await db.Foods.FindAsync(request.FoodId);
        if (food is null)
            throw new ApiException("Alimento não encontrado", 404);

        var entry = new PresetMealFood
        {
            PresetMealId = presetId,
            FoodId = request.FoodId,
            Quantity = request.Quantity
        };

        db.PresetMealFoods.Add(entry);
        await db.SaveChangesAsync();

        return new PresetMealFoodResponse(
            entry.Id,
            entry.Quantity,
            new FoodResponse(food.Id, food.Name, food.Calories, food.Protein, food.Carbs, food.Fat, food.Fibers, food.Portion)
        );
    }

    public async Task<PresetMealFoodResponse> UpdateFoodAsync(Guid presetId, Guid foodId, Guid userId, Guid? newFoodId, double? quantity)
    {
        var preset = await db.PresetMeals.FindAsync(presetId);
        if (preset is null)
            throw new ApiException("Refeição pronta não encontrada", 404);
        if (preset.UserId != userId)
            throw new ApiException("Acesso negado", 403);

        var entry = await db.PresetMealFoods
            .Include(pmf => pmf.Food)
            .FirstOrDefaultAsync(pmf => pmf.PresetMealId == presetId && pmf.FoodId == foodId);
        if (entry is null)
            throw new ApiException("Alimento não encontrado na refeição pronta", 404);

        if (newFoodId.HasValue && newFoodId.Value != foodId)
        {
            var newFood = await db.Foods.FindAsync(newFoodId.Value);
            if (newFood is null)
                throw new ApiException("Novo alimento não encontrado", 404);
            entry.FoodId = newFoodId.Value;
            entry.Food = newFood;
        }

        if (quantity.HasValue)
            entry.Quantity = quantity.Value;

        await db.SaveChangesAsync();

        return new PresetMealFoodResponse(
            entry.Id,
            entry.Quantity,
            new FoodResponse(entry.Food.Id, entry.Food.Name, entry.Food.Calories, entry.Food.Protein, entry.Food.Carbs, entry.Food.Fat, entry.Food.Fibers, entry.Food.Portion)
        );
    }

    public async Task RemoveFoodAsync(Guid presetId, Guid foodId, Guid userId)
    {
        var preset = await db.PresetMeals.FindAsync(presetId);
        if (preset is null)
            throw new ApiException("Refeição pronta não encontrada", 404);
        if (preset.UserId != userId)
            throw new ApiException("Acesso negado", 403);

        var entry = await db.PresetMealFoods
            .FirstOrDefaultAsync(pmf => pmf.PresetMealId == presetId && pmf.FoodId == foodId);
        if (entry is null)
            throw new ApiException("Alimento não encontrado na refeição pronta", 404);

        db.PresetMealFoods.Remove(entry);
        await db.SaveChangesAsync();
    }

    public async Task ApplyAsync(Guid presetId, Guid userId, List<Guid> targetMealIds)
    {
        if (targetMealIds.Count == 0) return;

        var preset = await db.PresetMeals
            .Include(pm => pm.Foods)
            .FirstOrDefaultAsync(pm => pm.Id == presetId);
        if (preset is null)
            throw new ApiException("Refeição pronta não encontrada", 404);
        if (preset.UserId != userId)
            throw new ApiException("Acesso negado", 403);

        var targets = await db.Meals
            .Include(m => m.Foods)
            .Include(m => m.DayPlan).ThenInclude(dp => dp.MealPlan)
            .Where(m => targetMealIds.Contains(m.Id))
            .ToListAsync();

        foreach (var target in targets)
        {
            if (target.DayPlan.MealPlan.UserId != userId)
                throw new ApiException("Acesso negado a uma refeição", 403);

            db.MealFoods.RemoveRange(target.Foods);
            target.IsCheat = false;

            foreach (var pf in preset.Foods)
            {
                db.MealFoods.Add(new MealFood
                {
                    MealId = target.Id,
                    FoodId = pf.FoodId,
                    Quantity = pf.Quantity
                });
            }
        }

        await db.SaveChangesAsync();
    }

    private IQueryable<PresetMeal> GetPresetsQuery() =>
        db.PresetMeals
            .Include(pm => pm.Foods)
                .ThenInclude(pmf => pmf.Food);

    private static PresetMealResponse ToResponse(PresetMeal preset) =>
        new(
            preset.Id,
            preset.Name,
            preset.Foods.Select(pmf => new PresetMealFoodResponse(
                pmf.Id,
                pmf.Quantity,
                new FoodResponse(pmf.Food.Id, pmf.Food.Name, pmf.Food.Calories, pmf.Food.Protein, pmf.Food.Carbs, pmf.Food.Fat, pmf.Food.Fibers, pmf.Food.Portion)
            )).ToList(),
            preset.CreatedAt,
            preset.UpdatedAt
        );
}
