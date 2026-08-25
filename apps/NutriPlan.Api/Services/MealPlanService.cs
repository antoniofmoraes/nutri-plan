using Microsoft.EntityFrameworkCore;
using NutriPlan.Api.Data;
using NutriPlan.Api.DTOs;
using NutriPlan.Api.Middleware;
using NutriPlan.Api.Models;

namespace NutriPlan.Api.Services;

public class MealPlanService(AppDbContext db, UndoService undo)
{
    public static readonly string[] WeekDays = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];

    public async Task<List<MealPlanResponse>> GetAllByUserAsync(Guid userId)
    {
        var mainPlanId = await GetMainPlanIdAsync(userId);

        var ownedPlans = await GetPlansQuery()
            .Where(mp => mp.UserId == userId)
            .OrderByDescending(mp => mp.Id == mainPlanId)
            .ThenByDescending(mp => mp.CreatedAt)
            .ToListAsync();

        var sharedPlans = await GetPlansQuery()
            .Include(mp => mp.User)
            .Where(mp => mp.SharedWithUserId == userId)
            .OrderByDescending(mp => mp.CreatedAt)
            .ToListAsync();

        var result = ownedPlans.Select(p => ToResponse(p, userId, mainPlanId)).ToList();
        result.AddRange(sharedPlans.Select(p => ToResponse(p, userId, mainPlanId)));
        return result;
    }

    public async Task<MealPlanResponse> GetByIdAsync(Guid id, Guid userId)
    {
        var plan = await GetPlansQuery()
            .Include(mp => mp.User)
            .Include(mp => mp.SharedWithUser)
            .FirstOrDefaultAsync(mp => mp.Id == id);
        if (plan is null)
            throw new ApiException("Plano alimentar não encontrado", 404);
        if (plan.UserId != userId && plan.SharedWithUserId != userId)
            throw new ApiException("Acesso negado", 403);

        var mainPlanId = await GetMainPlanIdAsync(userId);
        return ToResponse(plan, userId, mainPlanId);
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

        var before = await undo.CaptureMealPlansAsync([plan.Id], userId);

        db.MealPlans.Add(plan);
        await db.SaveChangesAsync();
        await undo.RecordAsync(userId, before);

        return ToResponse(plan, userId, mainPlanId: null);
    }

    public async Task<MealPlanResponse> UpdateAsync(Guid id, Guid userId, UpdateMealPlanRequest request)
    {
        var plan = await GetPlansQuery()
            .Include(mp => mp.User)
            .Include(mp => mp.SharedWithUser)
            .FirstOrDefaultAsync(mp => mp.Id == id);
        if (plan is null)
            throw new ApiException("Plano alimentar não encontrado", 404);
        AssertEditAccess(plan, userId);

        var before = await undo.CaptureMealPlansAsync([id], userId);

        if (request.Name is not null) plan.Name = request.Name;
        if (request.Goal is not null) plan.Goal = request.Goal;
        if (request.DailyCalories.HasValue) plan.DailyCalories = request.DailyCalories.Value;
        if (request.DailyProtein.HasValue) plan.DailyProtein = request.DailyProtein;
        if (request.DailyCarbs.HasValue) plan.DailyCarbs = request.DailyCarbs;
        if (request.DailyFat.HasValue) plan.DailyFat = request.DailyFat;

        await db.SaveChangesAsync();
        await undo.RecordAsync(userId, before);
        var mainPlanId = await GetMainPlanIdAsync(userId);
        return ToResponse(plan, userId, mainPlanId);
    }

    public async Task DeleteAsync(Guid id, Guid userId)
    {
        var plan = await db.MealPlans.FindAsync(id);
        if (plan is null)
            throw new ApiException("Plano alimentar não encontrado", 404);
        if (plan.UserId != userId)
            throw new ApiException("Acesso negado", 403);

        var before = await undo.CaptureMealPlansAsync([id], userId);

        db.MealPlans.Remove(plan);
        await db.SaveChangesAsync();
        await undo.RecordAsync(userId, before);
    }

    private Task<Guid?> GetMainPlanIdAsync(Guid userId) =>
        db.Users
            .Where(u => u.Id == userId)
            .Select(u => u.MainMealPlanId)
            .FirstOrDefaultAsync();

    private IQueryable<MealPlan> GetPlansQuery() =>
        db.MealPlans
            .Include(mp => mp.Slots.OrderBy(s => s.SortOrder))
            .Include(mp => mp.Days)
                .ThenInclude(d => d.Meals)
                    .ThenInclude(m => m.MealSlot)
            .Include(mp => mp.Days)
                .ThenInclude(d => d.Meals)
                    .ThenInclude(m => m.Foods)
                        .ThenInclude(mf => mf.Food);

    public static MealPlanResponse ToResponse(MealPlan plan, Guid requestingUserId, Guid? mainPlanId = null)
    {
        var isOwner = plan.UserId == requestingUserId;
        var role = isOwner ? "owner" : "shared";
        var canEdit = isOwner || plan.CanEdit;
        var ownerName = isOwner ? null : plan.User?.Name;

        ShareInfoResponse? sharedWith = null;
        MealPlanInviteResponse? activeInvite = null;

        if (isOwner)
        {
            if (plan.SharedWithUserId is not null && plan.SharedWithUser is not null)
            {
                sharedWith = new ShareInfoResponse(
                    plan.SharedWithUserId.Value,
                    plan.SharedWithUser.Name,
                    plan.CanEdit,
                    plan.SharedAt!.Value
                );
            }

            if (plan.InviteToken is not null && plan.InviteExpiresAt is not null && plan.InviteExpiresAt > DateTime.UtcNow)
            {
                activeInvite = new MealPlanInviteResponse(
                    plan.InviteToken,
                    plan.InviteExpiresAt.Value,
                    $"/convite/{plan.InviteToken}",
                    plan.InviteCanEdit
                );
            }
        }

        var orderedDays = plan.Days.OrderBy(d => Array.IndexOf(WeekDays, d.Day)).ToList();
        return new MealPlanResponse(
            plan.Id,
            plan.Name,
            plan.Goal,
            plan.DailyCalories,
            plan.DailyProtein,
            plan.DailyCarbs,
            plan.DailyFat,
            plan.Id == mainPlanId,
            role,
            canEdit,
            ownerName,
            sharedWith,
            activeInvite,
            plan.Slots.OrderBy(s => s.SortOrder).Select(s => new MealSlotResponse(s.Id, s.Name, s.Time, s.SortOrder)).ToList(),
            orderedDays.Select(d => new DayPlanResponse(
                d.Day,
                d.Meals.OrderBy(m => m.MealSlot.SortOrder).Select(m => new MealResponse(
                    m.Id,
                    m.MealSlotId,
                    m.MealSlot.Name,
                    m.MealSlot.Time,
                    m.IsCheat,
                    m.Foods.Select(mf => new MealFoodResponse(
                        mf.Id,
                        mf.Quantity,
                        new FoodResponse(mf.Food.Id, mf.Food.Name, mf.Food.Calories, mf.Food.Protein, mf.Food.Carbs, mf.Food.Fat, mf.Food.Fibers, mf.Food.Portion)
                    )).ToList()
                )).ToList()
            )).ToList(),
            plan.CreatedAt,
            plan.UpdatedAt
        );
    }

    public static void AssertEditAccess(MealPlan plan, Guid userId)
    {
        if (plan.UserId == userId) return;
        if (plan.SharedWithUserId == userId && plan.CanEdit) return;
        throw new ApiException("Acesso negado", 403);
    }
}
