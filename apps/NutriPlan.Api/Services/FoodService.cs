using Microsoft.EntityFrameworkCore;
using NutriPlan.Api.Data;
using NutriPlan.Api.DTOs;
using NutriPlan.Api.Middleware;
using NutriPlan.Api.Models;

namespace NutriPlan.Api.Services;

public class FoodService(AppDbContext db, UndoService undo)
{
    public async Task<PaginatedResponse<FoodResponse>> GetAllAsync(string? search, int page = 1, int pageSize = 50)
    {
        var query = db.Foods.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(f => EF.Functions.ILike(f.Name, $"%{search}%"));

        var total = await query.CountAsync();
        var foods = await query.OrderBy(f => f.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PaginatedResponse<FoodResponse>(
            foods.Select(ToResponse).ToList(),
            total,
            page,
            pageSize,
            page * pageSize < total
        );
    }

    public async Task<FoodResponse> GetByIdAsync(Guid id)
    {
        var food = await db.Foods.FindAsync(id);
        if (food is null)
            throw new ApiException("Alimento não encontrado", 404);

        return ToResponse(food);
    }

    public async Task<FoodResponse> CreateAsync(Guid userId, CreateFoodRequest request)
    {
        var food = new Food
        {
            Name = request.Name,
            Calories = request.Calories,
            Protein = request.Protein,
            Carbs = request.Carbs,
            Fat = request.Fat,
            Fibers = request.Fibers,
            Portion = request.Portion
        };

        var before = await undo.CaptureFoodsAsync([food.Id]);

        db.Foods.Add(food);
        await db.SaveChangesAsync();
        await undo.RecordAsync(userId, before);
        return ToResponse(food);
    }

    public async Task<FoodResponse> UpdateAsync(Guid id, Guid userId, UpdateFoodRequest request)
    {
        var food = await db.Foods.FindAsync(id);
        if (food is null)
            throw new ApiException("Alimento não encontrado", 404);

        var before = await undo.CaptureFoodsAsync([id]);

        if (request.Name is not null) food.Name = request.Name;
        if (request.Calories.HasValue) food.Calories = request.Calories.Value;
        if (request.Protein.HasValue) food.Protein = request.Protein.Value;
        if (request.Carbs.HasValue) food.Carbs = request.Carbs.Value;
        if (request.Fat.HasValue) food.Fat = request.Fat.Value;
        if (request.Fibers.HasValue) food.Fibers = request.Fibers.Value;
        if (request.Portion is not null) food.Portion = request.Portion;

        await db.SaveChangesAsync();
        await undo.RecordAsync(userId, before);
        return ToResponse(food);
    }

    // Sem undo por decisão de produto: excluir do catálogo cascateia para refeições e
    // refeições prontas de todos os usuários, então restaurar reescreveria dados de terceiros.
    public async Task DeleteAsync(Guid id)
    {
        var food = await db.Foods.FindAsync(id);
        if (food is null)
            throw new ApiException("Alimento não encontrado", 404);

        db.Foods.Remove(food);
        await db.SaveChangesAsync();
    }

    private static FoodResponse ToResponse(Food f) =>
        new(f.Id, f.Name, f.Calories, f.Protein, f.Carbs, f.Fat, f.Fibers, f.Portion);
}
