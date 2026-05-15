using Microsoft.EntityFrameworkCore;
using NutriPlan.Api.Data;
using NutriPlan.Api.DTOs;
using NutriPlan.Api.Middleware;
using NutriPlan.Api.Models;

namespace NutriPlan.Api.Services;

public class MealFoodService(AppDbContext db)
{
    public async Task<List<MealFoodResponse>> GetMealFoodsAsync(Guid mealId, Guid userId)
    {
        var meal = await GetMealWithOwnership(mealId, userId);

        var mealWithFoods = await db.Meals
            .Include(m => m.Foods).ThenInclude(mf => mf.Food)
            .FirstAsync(m => m.Id == mealId);

        return mealWithFoods.Foods.Select(ToResponse).ToList();
    }

    public async Task<MealFoodResponse> AddFoodToMealAsync(Guid mealId, Guid userId, AddFoodToMealRequest request)
    {
        await GetMealWithOwnership(mealId, userId);

        var food = await db.Foods.FindAsync(request.FoodId);
        if (food is null)
            throw new ApiException("Alimento não encontrado", 404);

        var existing = await db.MealFoods
            .Include(mf => mf.Food)
            .FirstOrDefaultAsync(mf => mf.MealId == mealId && mf.FoodId == request.FoodId);

        if (existing is not null)
        {
            existing.Quantity = request.Quantity;
            await db.SaveChangesAsync();
            return ToResponse(existing);
        }

        var mealFood = new MealFood
        {
            MealId = mealId,
            FoodId = request.FoodId,
            Quantity = request.Quantity
        };

        db.MealFoods.Add(mealFood);
        await db.SaveChangesAsync();

        mealFood.Food = food;
        return ToResponse(mealFood);
    }

    public async Task<MealFoodResponse> UpdateMealFoodAsync(Guid mealId, Guid foodId, Guid userId, Guid? newFoodId, double? quantity)
    {
        await GetMealWithOwnership(mealId, userId);

        var mealFood = await db.MealFoods
            .Include(mf => mf.Food)
            .FirstOrDefaultAsync(mf => mf.MealId == mealId && mf.FoodId == foodId);

        if (mealFood is null)
            throw new ApiException("Alimento não está na refeição", 404);

        var targetQuantity = quantity ?? mealFood.Quantity;
        var targetFoodId = newFoodId ?? foodId;

        if (targetFoodId == foodId)
        {
            mealFood.Quantity = targetQuantity;
            await db.SaveChangesAsync();
            return ToResponse(mealFood);
        }

        // Food swap: remove current row, then upsert the new food
        var newFood = await db.Foods.FindAsync(targetFoodId);
        if (newFood is null)
            throw new ApiException("Alimento não encontrado", 404);

        db.MealFoods.Remove(mealFood);
        await db.SaveChangesAsync();

        var existing = await db.MealFoods
            .Include(mf => mf.Food)
            .FirstOrDefaultAsync(mf => mf.MealId == mealId && mf.FoodId == targetFoodId);

        if (existing is not null)
        {
            existing.Quantity = targetQuantity;
            await db.SaveChangesAsync();
            return ToResponse(existing);
        }

        var swapped = new MealFood
        {
            MealId = mealId,
            FoodId = targetFoodId,
            Quantity = targetQuantity
        };
        db.MealFoods.Add(swapped);
        await db.SaveChangesAsync();
        swapped.Food = newFood;
        return ToResponse(swapped);
    }

    public async Task RemoveFoodFromMealAsync(Guid mealId, Guid foodId, Guid userId)
    {
        await GetMealWithOwnership(mealId, userId);

        var mealFood = await db.MealFoods
            .FirstOrDefaultAsync(mf => mf.MealId == mealId && mf.FoodId == foodId);

        if (mealFood is null)
            throw new ApiException("Alimento não está na refeição", 404);

        db.MealFoods.Remove(mealFood);
        await db.SaveChangesAsync();
    }

    private async Task<Meal> GetMealWithOwnership(Guid mealId, Guid userId)
    {
        var meal = await db.Meals
            .Include(m => m.DayPlan).ThenInclude(dp => dp.MealPlan)
            .FirstOrDefaultAsync(m => m.Id == mealId);

        if (meal is null)
            throw new ApiException("Refeição não encontrada", 404);
        if (meal.DayPlan.MealPlan.UserId != userId)
            throw new ApiException("Acesso negado", 403);

        return meal;
    }

    private static MealFoodResponse ToResponse(MealFood mf) =>
        new(mf.Id, mf.Quantity,
            new FoodResponse(mf.Food.Id, mf.Food.Name, mf.Food.Calories, mf.Food.Protein, mf.Food.Carbs, mf.Food.Fat, mf.Food.Fibers, mf.Food.Portion));
}
