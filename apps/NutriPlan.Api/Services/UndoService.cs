using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using NutriPlan.Api.Data;
using NutriPlan.Api.DTOs;
using NutriPlan.Api.Middleware;
using NutriPlan.Api.Models;

namespace NutriPlan.Api.Services;

/// Undo por snapshot: o service captura o estado ANTES de mutar, grava a entrada junto da
/// mutação e devolve um token. Desfazer restaura o snapshot em uma transação, desde que
/// nada mais novo tenha tocado no mesmo escopo (ver Fingerprint).
public class UndoService(AppDbContext db)
{
    private static readonly TimeSpan Ttl = TimeSpan.FromMinutes(5);

    /// Token gravado nesta requisição. O service é scoped, então cada request tem o seu;
    /// o endpoint lê daqui para devolver no envelope sem mudar a assinatura dos services.
    public Guid? LastToken { get; private set; }

    private static readonly JsonSerializerOptions Json = new()
    {
        // Ordem estável de propriedades e sem indentação: o JSON precisa ser comparável byte a byte.
        WriteIndented = false,
    };

    // ---------- captura ----------

    public Task<UndoSnapshot> CaptureMealsAsync(IEnumerable<Guid> mealIds) =>
        CaptureMealsInternalAsync(mealIds.Distinct().OrderBy(id => id).ToList());

    private async Task<UndoSnapshot> CaptureMealsInternalAsync(List<Guid> ids)
    {
        var meals = await db.Meals
            .Include(m => m.Foods)
            .Where(m => ids.Contains(m.Id))
            .ToListAsync();

        var states = ids
            .Select(id => meals.FirstOrDefault(m => m.Id == id))
            .Where(m => m is not null)
            .Select(m => new MealState(
                m!.Id,
                m.MealSlotId,
                m.IsCheat,
                m.Foods.OrderBy(f => f.Id).Select(f => new MealFoodState(f.Id, f.FoodId, f.Quantity)).ToList()))
            .ToList();

        return new UndoSnapshot(UndoKind.Meals, Meals: states);
    }

    public async Task<UndoSnapshot> CapturePresetMealsAsync(IEnumerable<Guid> presetIds)
    {
        var ids = presetIds.Distinct().OrderBy(id => id).ToList();
        var presets = await db.PresetMeals
            .Include(pm => pm.Foods)
            .Where(pm => ids.Contains(pm.Id))
            .ToListAsync();

        var states = ids.Select(id =>
        {
            var preset = presets.FirstOrDefault(p => p.Id == id);
            return preset is null
                ? new PresetMealState(id, null, null)
                : new PresetMealState(
                    preset.Id,
                    preset.Name,
                    preset.Foods.OrderBy(f => f.Id).Select(f => new MealFoodState(f.Id, f.FoodId, f.Quantity)).ToList());
        }).ToList();

        return new UndoSnapshot(UndoKind.PresetMeals, PresetMeals: states);
    }

    public async Task<UndoSnapshot> CaptureFoodsAsync(IEnumerable<Guid> foodIds)
    {
        var ids = foodIds.Distinct().OrderBy(id => id).ToList();
        var foods = await db.Foods.Where(f => ids.Contains(f.Id)).ToListAsync();

        var states = ids.Select(id =>
        {
            var food = foods.FirstOrDefault(f => f.Id == id);
            return food is null
                ? new FoodState(id, null, 0, 0, 0, 0, 0, "100g")
                : new FoodState(food.Id, food.Name, food.Calories, food.Protein, food.Carbs, food.Fat, food.Fibers, food.Portion);
        }).ToList();

        return new UndoSnapshot(UndoKind.Foods, Foods: states);
    }

    public async Task<UndoSnapshot> CaptureMealPlansAsync(IEnumerable<Guid> planIds, Guid userId)
    {
        var ids = planIds.Distinct().OrderBy(id => id).ToList();
        var plans = await db.MealPlans
            .Include(mp => mp.Slots)
            .Include(mp => mp.Days).ThenInclude(d => d.Meals).ThenInclude(m => m.Foods)
            .Where(mp => ids.Contains(mp.Id))
            .ToListAsync();

        var mainPlanId = (await db.Users.FindAsync(userId))?.MainMealPlanId;

        var states = ids.Select(id =>
        {
            var plan = plans.FirstOrDefault(p => p.Id == id);
            if (plan is null)
                return new MealPlanState(id, null, "manter", 0, null, null, null, false, [], []);

            return new MealPlanState(
                plan.Id,
                plan.Name,
                plan.Goal,
                plan.DailyCalories,
                plan.DailyProtein,
                plan.DailyCarbs,
                plan.DailyFat,
                mainPlanId == plan.Id,
                plan.Slots.OrderBy(s => s.Id).Select(s => new MealSlotState(s.Id, s.Name, s.Time, s.SortOrder)).ToList(),
                plan.Days.OrderBy(d => d.Id).Select(d => new DayPlanState(
                    d.Id,
                    d.Day,
                    d.Meals.OrderBy(m => m.Id).Select(m => new MealState(
                        m.Id,
                        m.MealSlotId,
                        m.IsCheat,
                        m.Foods.OrderBy(f => f.Id).Select(f => new MealFoodState(f.Id, f.FoodId, f.Quantity)).ToList()
                    )).ToList()
                )).ToList());
        }).ToList();

        return new UndoSnapshot(UndoKind.MealPlans, MealPlans: states);
    }

    private Task<UndoSnapshot> RecaptureAsync(UndoSnapshot before, Guid userId) => before.Kind switch
    {
        UndoKind.Meals => CaptureMealsInternalAsync(before.Meals!.Select(m => m.Id).OrderBy(id => id).ToList()),
        UndoKind.PresetMeals => CapturePresetMealsAsync(before.PresetMeals!.Select(p => p.Id)),
        UndoKind.Foods => CaptureFoodsAsync(before.Foods!.Select(f => f.Id)),
        UndoKind.MealPlans => CaptureMealPlansAsync(before.MealPlans!.Select(p => p.Id), userId),
        _ => throw new ApiException("Tipo de undo desconhecido", 400),
    };

    // ---------- registro ----------

    /// Grava a entrada de undo. Chamar DEPOIS do SaveChanges da mutação, passando o snapshot
    /// capturado ANTES dela — é o estado posterior que vira impressão de conflito.
    public async Task<Guid> RecordAsync(Guid userId, UndoSnapshot before)
    {
        var after = await RecaptureAsync(before, userId);

        var entry = new UndoEntry
        {
            UserId = userId,
            Kind = before.Kind.ToString(),
            Snapshot = JsonSerializer.Serialize(before, Json),
            Fingerprint = Fingerprint(after),
            ExpiresAt = DateTime.UtcNow.Add(Ttl),
        };

        db.UndoEntries.Add(entry);
        await PurgeExpiredAsync();
        await db.SaveChangesAsync();
        LastToken = entry.Id;
        return entry.Id;
    }

    private static string Fingerprint(UndoSnapshot snapshot)
    {
        var json = JsonSerializer.Serialize(snapshot, Json);
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(json)));
    }

    private async Task PurgeExpiredAsync()
    {
        var cutoff = DateTime.UtcNow.AddHours(-1);
        await db.UndoEntries.Where(e => e.ExpiresAt < cutoff).ExecuteDeleteAsync();
    }

    // ---------- desfazer ----------

    public async Task<UndoResponse> UndoAsync(Guid token, Guid userId)
    {
        var entry = await db.UndoEntries.FirstOrDefaultAsync(e => e.Id == token);
        if (entry is null)
            throw new ApiException("Não há mais o que desfazer", 404);
        if (entry.UserId != userId)
            throw new ApiException("Acesso negado", 403);
        if (entry.ConsumedAt is not null)
            throw new ApiException("Esta alteração já foi desfeita", 409);
        if (entry.ExpiresAt < DateTime.UtcNow)
            throw new ApiException("O prazo para desfazer esta alteração expirou", 409);

        var before = JsonSerializer.Deserialize<UndoSnapshot>(entry.Snapshot, Json)
            ?? throw new ApiException("Não foi possível desfazer", 500);

        var current = await RecaptureAsync(before, userId);
        if (Fingerprint(current) != entry.Fingerprint)
            throw new ApiException("Uma alteração mais recente impede desfazer esta operação", 409);

        await using var tx = await db.Database.BeginTransactionAsync();

        var domains = before.Kind switch
        {
            UndoKind.Meals => await RestoreMealsAsync(before.Meals!, userId),
            UndoKind.PresetMeals => await RestorePresetMealsAsync(before.PresetMeals!, userId),
            UndoKind.Foods => await RestoreFoodsAsync(before.Foods!),
            UndoKind.MealPlans => await RestoreMealPlansAsync(before.MealPlans!, userId),
            _ => throw new ApiException("Tipo de undo desconhecido", 400),
        };

        entry.ConsumedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        await tx.CommitAsync();

        return new UndoResponse("Alteração desfeita", domains);
    }

    private async Task<List<string>> RestoreMealsAsync(List<MealState> states, Guid userId)
    {
        var ids = states.Select(s => s.Id).ToList();
        var meals = await db.Meals
            .WithOwnership()
            .Include(m => m.Foods)
            .Where(m => ids.Contains(m.Id))
            .ToListAsync();

        foreach (var state in states)
        {
            var meal = meals.FirstOrDefault(m => m.Id == state.Id);
            if (meal is null)
                throw new ApiException("A refeição desta alteração não existe mais", 409);

            meal.AssertEditAccess(userId);
            meal.IsCheat = state.IsCheat;
            db.MealFoods.RemoveRange(meal.Foods);
            foreach (var food in state.Foods)
            {
                db.MealFoods.Add(new MealFood
                {
                    Id = food.Id,
                    MealId = meal.Id,
                    FoodId = food.FoodId,
                    Quantity = food.Quantity,
                });
            }
        }

        await db.SaveChangesAsync();
        return ["meal-plans"];
    }

    private async Task<List<string>> RestorePresetMealsAsync(List<PresetMealState> states, Guid userId)
    {
        var ids = states.Select(s => s.Id).ToList();
        var presets = await db.PresetMeals
            .Include(pm => pm.Foods)
            .Where(pm => ids.Contains(pm.Id))
            .ToListAsync();

        foreach (var state in states)
        {
            var preset = presets.FirstOrDefault(p => p.Id == state.Id);

            if (state.Name is null)
            {
                // Não existia antes: desfazer uma criação apaga.
                if (preset is not null)
                {
                    if (preset.UserId != userId) throw new ApiException("Acesso negado", 403);
                    db.PresetMeals.Remove(preset);
                }
                continue;
            }

            if (preset is null)
            {
                preset = new PresetMeal { Id = state.Id, Name = state.Name, UserId = userId };
                db.PresetMeals.Add(preset);
            }
            else
            {
                if (preset.UserId != userId) throw new ApiException("Acesso negado", 403);
                preset.Name = state.Name;
                db.PresetMealFoods.RemoveRange(preset.Foods);
            }

            foreach (var food in state.Foods ?? [])
            {
                db.PresetMealFoods.Add(new PresetMealFood
                {
                    Id = food.Id,
                    PresetMealId = preset.Id,
                    FoodId = food.FoodId,
                    Quantity = food.Quantity,
                });
            }
        }

        await db.SaveChangesAsync();
        return ["preset-meals"];
    }

    private async Task<List<string>> RestoreFoodsAsync(List<FoodState> states)
    {
        var ids = states.Select(s => s.Id).ToList();
        var foods = await db.Foods.Where(f => ids.Contains(f.Id)).ToListAsync();

        foreach (var state in states)
        {
            var food = foods.FirstOrDefault(f => f.Id == state.Id);

            if (state.Name is null)
            {
                if (food is not null) db.Foods.Remove(food);
                continue;
            }

            // Excluir alimento do catálogo está fora do undo (cascateia para dados de
            // terceiros), então aqui só existe restaurar edição ou desfazer criação.
            if (food is null)
                throw new ApiException("O alimento desta alteração não existe mais", 409);

            food.Name = state.Name;
            food.Calories = state.Calories;
            food.Protein = state.Protein;
            food.Carbs = state.Carbs;
            food.Fat = state.Fat;
            food.Fibers = state.Fibers;
            food.Portion = state.Portion;
        }

        await db.SaveChangesAsync();
        return ["foods"];
    }

    private async Task<List<string>> RestoreMealPlansAsync(List<MealPlanState> states, Guid userId)
    {
        var ids = states.Select(s => s.Id).ToList();
        var plans = await db.MealPlans
            .Include(mp => mp.Slots)
            .Include(mp => mp.Days).ThenInclude(d => d.Meals).ThenInclude(m => m.Foods)
            .Where(mp => ids.Contains(mp.Id))
            .ToListAsync();

        var user = await db.Users.FindAsync(userId)
            ?? throw new ApiException("Usuário não encontrado", 404);

        foreach (var state in states)
        {
            var plan = plans.FirstOrDefault(p => p.Id == state.Id);

            if (state.Name is null)
            {
                if (plan is not null)
                {
                    if (plan.UserId != userId) throw new ApiException("Acesso negado", 403);
                    db.MealPlans.Remove(plan);
                }
                continue;
            }

            if (plan is null)
            {
                plan = new MealPlan { Id = state.Id, Name = state.Name, Goal = state.Goal, UserId = userId };
                db.MealPlans.Add(plan);
            }
            else
            {
                // Editor de plano compartilhado pode desfazer a própria alteração de slots;
                // criar/excluir o plano em si (acima e abaixo) continua exigindo ser dono.
                MealPlanService.AssertEditAccess(plan, userId);
                db.MealSlots.RemoveRange(plan.Slots);
                db.DayPlans.RemoveRange(plan.Days);
            }

            plan.Name = state.Name;
            plan.Goal = state.Goal;
            plan.DailyCalories = state.DailyCalories;
            plan.DailyProtein = state.DailyProtein;
            plan.DailyCarbs = state.DailyCarbs;
            plan.DailyFat = state.DailyFat;

            foreach (var slot in state.Slots)
            {
                db.MealSlots.Add(new MealSlot
                {
                    Id = slot.Id,
                    Name = slot.Name,
                    Time = slot.Time,
                    SortOrder = slot.SortOrder,
                    MealPlanId = plan.Id,
                });
            }

            foreach (var day in state.Days)
            {
                db.DayPlans.Add(new DayPlan { Id = day.Id, Day = day.Day, MealPlanId = plan.Id });
                foreach (var meal in day.Meals)
                {
                    db.Meals.Add(new Meal
                    {
                        Id = meal.Id,
                        DayPlanId = day.Id,
                        MealSlotId = meal.MealSlotId,
                        IsCheat = meal.IsCheat,
                    });
                    foreach (var food in meal.Foods)
                    {
                        db.MealFoods.Add(new MealFood
                        {
                            Id = food.Id,
                            MealId = meal.Id,
                            FoodId = food.FoodId,
                            Quantity = food.Quantity,
                        });
                    }
                }
            }

            if (state.IsMain) user.MainMealPlanId = plan.Id;
            else if (user.MainMealPlanId == plan.Id) user.MainMealPlanId = null;
        }

        await db.SaveChangesAsync();
        return ["meal-plans"];
    }
}
