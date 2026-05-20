using Microsoft.EntityFrameworkCore;
using NutriPlan.Api.Data;
using NutriPlan.Api.DTOs;
using NutriPlan.Api.Middleware;
using NutriPlan.Api.Models;

namespace NutriPlan.Api.Services;

public class MealSlotService(AppDbContext db)
{
    public async Task<MealSlotResponse> CreateAsync(Guid planId, Guid userId, CreateMealSlotRequest request)
    {
        var plan = await LoadOwnedPlanAsync(planId, userId, q => q.Include(mp => mp.Days).Include(mp => mp.Slots));

        var nextSortOrder = plan.Slots.Count == 0 ? 0 : plan.Slots.Max(s => s.SortOrder) + 1;

        var slot = new MealSlot
        {
            Name = request.Name,
            Time = request.Time,
            MealPlanId = planId,
            SortOrder = nextSortOrder
        };

        db.MealSlots.Add(slot);

        // Auto-create Meal instance for every existing DayPlan
        foreach (var dayPlan in plan.Days)
        {
            db.Meals.Add(new Meal
            {
                MealSlotId = slot.Id,
                DayPlanId = dayPlan.Id
            });
        }

        await db.SaveChangesAsync();

        return new MealSlotResponse(slot.Id, slot.Name, slot.Time, slot.SortOrder);
    }

    public async Task<MealSlotResponse> UpdateAsync(Guid planId, Guid slotId, Guid userId, UpdateMealSlotRequest request)
    {
        var slot = await LoadOwnedSlotAsync(planId, slotId, userId);

        if (request.Name is not null) slot.Name = request.Name;
        if (request.Time is not null) slot.Time = string.IsNullOrWhiteSpace(request.Time) ? null : request.Time;

        await db.SaveChangesAsync();
        return new MealSlotResponse(slot.Id, slot.Name, slot.Time, slot.SortOrder);
    }

    public async Task ReorderAsync(Guid planId, Guid userId, List<Guid> slotIds)
    {
        var plan = await LoadOwnedPlanAsync(planId, userId, q => q.Include(mp => mp.Slots));

        var planSlotIds = plan.Slots.Select(s => s.Id).ToHashSet();
        if (slotIds.Count != planSlotIds.Count || !slotIds.All(planSlotIds.Contains))
            throw new ApiException("Lista de slots inválida", 400);

        for (var i = 0; i < slotIds.Count; i++)
        {
            var slot = plan.Slots.First(s => s.Id == slotIds[i]);
            slot.SortOrder = i;
        }

        await db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid planId, Guid slotId, Guid userId)
    {
        var slot = await LoadOwnedSlotAsync(planId, slotId, userId);

        db.MealSlots.Remove(slot);
        await db.SaveChangesAsync();
    }

    private async Task<MealPlan> LoadOwnedPlanAsync(Guid planId, Guid userId, Func<IQueryable<MealPlan>, IQueryable<MealPlan>> withIncludes)
    {
        var plan = await withIncludes(db.MealPlans).FirstOrDefaultAsync(mp => mp.Id == planId);
        if (plan is null)
            throw new ApiException("Plano alimentar não encontrado", 404);
        if (plan.UserId != userId)
            throw new ApiException("Acesso negado", 403);
        return plan;
    }

    private async Task<MealSlot> LoadOwnedSlotAsync(Guid planId, Guid slotId, Guid userId)
    {
        var slot = await db.MealSlots
            .Include(s => s.MealPlan)
            .FirstOrDefaultAsync(s => s.Id == slotId && s.MealPlanId == planId);
        if (slot is null)
            throw new ApiException("Refeição não encontrada", 404);
        if (slot.MealPlan.UserId != userId)
            throw new ApiException("Acesso negado", 403);
        return slot;
    }
}
