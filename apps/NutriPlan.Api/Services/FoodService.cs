using Microsoft.EntityFrameworkCore;
using NutriPlan.Api.Data;
using NutriPlan.Api.DTOs;
using NutriPlan.Api.Middleware;
using NutriPlan.Api.Models;

namespace NutriPlan.Api.Services;

public class FoodService(AppDbContext db)
{
    public async Task<List<FoodResponse>> GetAllAsync(string? search)
    {
        var query = db.Foods.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(f => EF.Functions.ILike(f.Name, $"%{search}%"));

        var foods = await query.OrderBy(f => f.Name).ToListAsync();
        return foods.Select(ToResponse).ToList();
    }

    public async Task<FoodResponse> GetByIdAsync(Guid id)
    {
        var food = await db.Foods.FindAsync(id);
        if (food is null)
            throw new ApiException("Alimento não encontrado", 404);

        return ToResponse(food);
    }

    public async Task<FoodResponse> CreateAsync(CreateFoodRequest request)
    {
        var food = new Food
        {
            Name = request.Name,
            Calories = request.Calories,
            Protein = request.Protein,
            Carbs = request.Carbs,
            Fat = request.Fat,
            Portion = request.Portion
        };

        db.Foods.Add(food);
        await db.SaveChangesAsync();
        return ToResponse(food);
    }

    public async Task<FoodResponse> UpdateAsync(Guid id, UpdateFoodRequest request)
    {
        var food = await db.Foods.FindAsync(id);
        if (food is null)
            throw new ApiException("Alimento não encontrado", 404);

        if (request.Name is not null) food.Name = request.Name;
        if (request.Calories.HasValue) food.Calories = request.Calories.Value;
        if (request.Protein.HasValue) food.Protein = request.Protein.Value;
        if (request.Carbs.HasValue) food.Carbs = request.Carbs.Value;
        if (request.Fat.HasValue) food.Fat = request.Fat.Value;
        if (request.Portion is not null) food.Portion = request.Portion;

        await db.SaveChangesAsync();
        return ToResponse(food);
    }

    public async Task DeleteAsync(Guid id)
    {
        var food = await db.Foods.FindAsync(id);
        if (food is null)
            throw new ApiException("Alimento não encontrado", 404);

        db.Foods.Remove(food);
        await db.SaveChangesAsync();
    }

    private static FoodResponse ToResponse(Food f) =>
        new(f.Id, f.Name, f.Calories, f.Protein, f.Carbs, f.Fat, f.Portion);
}
