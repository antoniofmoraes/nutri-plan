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
        var meal = await db.Meals
            .WithOwnership()
            .Include(m => m.Foods).ThenInclude(mf => mf.Food)
            .FirstOrDefaultAsync(m => m.Id == mealId);

        if (meal is null)
            throw new ApiException("Refeição não encontrada", 404);
        meal.AssertReadAccess(userId);

        return meal.Foods.Select(ToResponse).ToList();
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

        // Food swap: remove current row, then upsert the new food (atomic)
        var newFood = await db.Foods.FindAsync(targetFoodId);
        if (newFood is null)
            throw new ApiException("Alimento não encontrado", 404);

        await using var tx = await db.Database.BeginTransactionAsync();

        db.MealFoods.Remove(mealFood);
        await db.SaveChangesAsync();

        var existing = await db.MealFoods
            .Include(mf => mf.Food)
            .FirstOrDefaultAsync(mf => mf.MealId == mealId && mf.FoodId == targetFoodId);

        MealFood result;
        if (existing is not null)
        {
            existing.Quantity = targetQuantity;
            result = existing;
        }
        else
        {
            result = new MealFood
            {
                MealId = mealId,
                FoodId = targetFoodId,
                Quantity = targetQuantity,
                Food = newFood
            };
            db.MealFoods.Add(result);
        }

        await db.SaveChangesAsync();
        await tx.CommitAsync();
        return ToResponse(result);
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
            .WithOwnership()
            .FirstOrDefaultAsync(m => m.Id == mealId);

        if (meal is null)
            throw new ApiException("Refeição não encontrada", 404);
        meal.AssertEditAccess(userId);

        return meal;
    }

    private static MealFoodResponse ToResponse(MealFood mf) =>
        new(mf.Id, mf.Quantity,
            new FoodResponse(mf.Food.Id, mf.Food.Name, mf.Food.Calories, mf.Food.Protein, mf.Food.Carbs, mf.Food.Fat, mf.Food.Fibers, mf.Food.Portion));
}
