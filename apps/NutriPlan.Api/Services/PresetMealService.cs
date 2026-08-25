using Microsoft.EntityFrameworkCore;
using NutriPlan.Api.Data;
using NutriPlan.Api.DTOs;
using NutriPlan.Api.Middleware;
using NutriPlan.Api.Models;

namespace NutriPlan.Api.Services;

public class PresetMealService(AppDbContext db, UndoService undo)
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
        var preset = await GetPresetWithOwnership(id, userId, includeFoods: true);
        return ToResponse(preset);
    }

    public async Task<PresetMealResponse> CreateAsync(Guid userId, CreatePresetMealRequest request)
    {
        var preset = new PresetMeal
        {
            Name = request.Name,
            UserId = userId
        };

        var before = await undo.CapturePresetMealsAsync([preset.Id]);

        db.PresetMeals.Add(preset);
        await db.SaveChangesAsync();
        await undo.RecordAsync(userId, before);

        return ToResponse(preset);
    }

    public async Task<PresetMealResponse> UpdateAsync(Guid id, Guid userId, UpdatePresetMealRequest request)
    {
        var preset = await GetPresetWithOwnership(id, userId, includeFoods: true);

        var before = await undo.CapturePresetMealsAsync([id]);

        if (request.Name is not null) preset.Name = request.Name;

        await db.SaveChangesAsync();
        await undo.RecordAsync(userId, before);
        return ToResponse(preset);
    }

    public async Task<PresetMealResponse> DuplicateAsync(Guid id, Guid userId)
    {
        var source = await GetPresetWithOwnership(id, userId, includeFoods: true);

        var copy = new PresetMeal
        {
            Name = $"{source.Name} (cópia)",
            UserId = userId
        };
        var before = await undo.CapturePresetMealsAsync([copy.Id]);

        db.PresetMeals.Add(copy);
        await db.SaveChangesAsync();

        foreach (var f in source.Foods)
        {
            db.PresetMealFoods.Add(new PresetMealFood
            {
                PresetMealId = copy.Id,
                FoodId = f.FoodId,
                Quantity = f.Quantity
            });
        }
        await db.SaveChangesAsync();
        await undo.RecordAsync(userId, before);

        var result = await GetPresetsQuery().FirstAsync(pm => pm.Id == copy.Id);
        return ToResponse(result);
    }

    public async Task DeleteAsync(Guid id, Guid userId)
    {
        var preset = await GetPresetWithOwnership(id, userId);

        var before = await undo.CapturePresetMealsAsync([id]);

        db.PresetMeals.Remove(preset);
        await db.SaveChangesAsync();
        await undo.RecordAsync(userId, before);
    }

    public async Task<PresetMealFoodResponse> AddFoodAsync(Guid presetId, Guid userId, AddPresetMealFoodRequest request)
    {
        await GetPresetWithOwnership(presetId, userId);

        var food = await db.Foods.FindAsync(request.FoodId);
        if (food is null)
            throw new ApiException("Alimento não encontrado", 404);

        var before = await undo.CapturePresetMealsAsync([presetId]);

        // Upsert: (PresetMealId, FoodId) é único — repetir o alimento atualiza a quantidade
        var entry = await db.PresetMealFoods
            .FirstOrDefaultAsync(pmf => pmf.PresetMealId == presetId && pmf.FoodId == request.FoodId);

        if (entry is null)
        {
            entry = new PresetMealFood
            {
                PresetMealId = presetId,
                FoodId = request.FoodId,
                Quantity = request.Quantity
            };
            db.PresetMealFoods.Add(entry);
        }
        else
        {
            entry.Quantity = request.Quantity;
        }

        await db.SaveChangesAsync();
        await undo.RecordAsync(userId, before);

        return new PresetMealFoodResponse(
            entry.Id,
            entry.Quantity,
            new FoodResponse(food.Id, food.Name, food.Calories, food.Protein, food.Carbs, food.Fat, food.Fibers, food.Portion)
        );
    }

    public async Task<PresetMealFoodResponse> UpdateFoodAsync(Guid presetId, Guid foodId, Guid userId, Guid? newFoodId, double? quantity)
    {
        await GetPresetWithOwnership(presetId, userId);

        var entry = await db.PresetMealFoods
            .Include(pmf => pmf.Food)
            .FirstOrDefaultAsync(pmf => pmf.PresetMealId == presetId && pmf.FoodId == foodId);
        if (entry is null)
            throw new ApiException("Alimento não encontrado na refeição pronta", 404);

        var before = await undo.CapturePresetMealsAsync([presetId]);

        if (newFoodId.HasValue && newFoodId.Value != foodId)
        {
            var newFood = await db.Foods.FindAsync(newFoodId.Value);
            if (newFood is null)
                throw new ApiException("Novo alimento não encontrado", 404);

            var duplicate = await db.PresetMealFoods
                .AnyAsync(pmf => pmf.PresetMealId == presetId && pmf.FoodId == newFoodId.Value);
            if (duplicate)
                throw new ApiException("Esse alimento já está na refeição pronta", 409);

            entry.FoodId = newFoodId.Value;
            entry.Food = newFood;
        }

        if (quantity.HasValue)
            entry.Quantity = quantity.Value;

        await db.SaveChangesAsync();
        await undo.RecordAsync(userId, before);

        return new PresetMealFoodResponse(
            entry.Id,
            entry.Quantity,
            new FoodResponse(entry.Food.Id, entry.Food.Name, entry.Food.Calories, entry.Food.Protein, entry.Food.Carbs, entry.Food.Fat, entry.Food.Fibers, entry.Food.Portion)
        );
    }

    /// Copia os alimentos de uma refeição pronta para outra em uma operação só. Existe como
    /// endpoint (em vez de um laço de AddFood no cliente) para o undo reverter a cópia
    /// inteira, e não apenas o último alimento — R5 da CHG-002.
    public async Task CopyFoodsFromAsync(Guid targetId, Guid sourceId, Guid userId)
    {
        if (targetId == sourceId)
            throw new ApiException("Origem e destino são a mesma refeição pronta", 400);

        var target = await GetPresetWithOwnership(targetId, userId, includeFoods: true);
        var source = await GetPresetWithOwnership(sourceId, userId, includeFoods: true);

        if (source.Foods.Count == 0)
            throw new ApiException("A refeição arrastada não tem alimentos para copiar", 400);

        var before = await undo.CapturePresetMealsAsync([targetId]);

        foreach (var item in source.Foods)
        {
            var existing = target.Foods.FirstOrDefault(f => f.FoodId == item.FoodId);
            if (existing is not null)
            {
                existing.Quantity = item.Quantity;
                continue;
            }

            db.PresetMealFoods.Add(new PresetMealFood
            {
                PresetMealId = targetId,
                FoodId = item.FoodId,
                Quantity = item.Quantity,
            });
        }

        await db.SaveChangesAsync();
        await undo.RecordAsync(userId, before);
    }

    public async Task RemoveFoodAsync(Guid presetId, Guid foodId, Guid userId)
    {
        await GetPresetWithOwnership(presetId, userId);

        var entry = await db.PresetMealFoods
            .FirstOrDefaultAsync(pmf => pmf.PresetMealId == presetId && pmf.FoodId == foodId);
        if (entry is null)
            throw new ApiException("Alimento não encontrado na refeição pronta", 404);

        var before = await undo.CapturePresetMealsAsync([presetId]);

        db.PresetMealFoods.Remove(entry);
        await db.SaveChangesAsync();
        await undo.RecordAsync(userId, before);
    }

    public async Task ApplyAsync(Guid presetId, Guid userId, List<Guid> targetMealIds)
    {
        if (targetMealIds.Count == 0) return;

        var preset = await GetPresetWithOwnership(presetId, userId, includeFoods: true);

        var targets = await db.Meals
            .WithOwnership()
            .Include(m => m.Foods)
            .Where(m => targetMealIds.Contains(m.Id))
            .ToListAsync();

        var items = preset.Foods.Select(pf => (pf.FoodId, pf.Quantity)).ToList();

        var before = await undo.CaptureMealsAsync(targets.Select(t => t.Id));

        foreach (var target in targets)
        {
            target.AssertEditAccess(userId);
            db.ReplaceFoods(target, items);
        }

        await db.SaveChangesAsync();
        await undo.RecordAsync(userId, before);
    }

    private async Task<PresetMeal> GetPresetWithOwnership(Guid id, Guid userId, bool includeFoods = false)
    {
        var query = includeFoods ? GetPresetsQuery() : db.PresetMeals.AsQueryable();
        var preset = await query.FirstOrDefaultAsync(pm => pm.Id == id);
        if (preset is null)
            throw new ApiException("Refeição pronta não encontrada", 404);
        if (preset.UserId != userId)
            throw new ApiException("Acesso negado", 403);
        return preset;
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
