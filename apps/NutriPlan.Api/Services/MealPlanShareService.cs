using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using NutriPlan.Api.Data;
using NutriPlan.Api.DTOs;
using NutriPlan.Api.Middleware;

namespace NutriPlan.Api.Services;

public class MealPlanShareService(AppDbContext db)
{
    private const int InviteExpirationDays = 3;

    public async Task<MealPlanInviteResponse> GenerateInviteAsync(Guid planId, Guid userId, bool canEdit)
    {
        var plan = await GetOwnedPlanAsync(planId, userId);

        if (plan.SharedWithUserId is not null)
            throw new ApiException("Este plano já está compartilhado com alguém", 400);

        plan.InviteToken = GenerateToken();
        plan.InviteCanEdit = canEdit;
        plan.InviteExpiresAt = DateTime.UtcNow.AddDays(InviteExpirationDays);
        await db.SaveChangesAsync();

        return new MealPlanInviteResponse(
            plan.InviteToken,
            plan.InviteExpiresAt.Value,
            $"/convite/{plan.InviteToken}",
            plan.InviteCanEdit
        );
    }

    public async Task RevokeInviteAsync(Guid planId, Guid userId)
    {
        var plan = await GetOwnedPlanAsync(planId, userId);
        plan.InviteToken = null;
        plan.InviteCanEdit = false;
        plan.InviteExpiresAt = null;
        await db.SaveChangesAsync();
    }

    public async Task<InviteInfoResponse> GetInviteInfoAsync(string token)
    {
        var plan = await db.MealPlans
            .Include(mp => mp.User)
            .Include(mp => mp.Slots)
            .FirstOrDefaultAsync(mp => mp.InviteToken == token);

        if (plan is null)
            throw new ApiException("Convite não encontrado", 404);

        if (plan.InviteExpiresAt is null || plan.InviteExpiresAt < DateTime.UtcNow)
            throw new ApiException("Convite expirado", 400);

        return new InviteInfoResponse(
            plan.Id,
            plan.Name,
            plan.Goal,
            plan.DailyCalories,
            plan.Slots.Count,
            plan.User.Name,
            plan.InviteCanEdit
        );
    }

    public async Task<Guid> AcceptInviteAsync(string token, Guid userId)
    {
        var plan = await db.MealPlans
            .FirstOrDefaultAsync(mp => mp.InviteToken == token);

        if (plan is null)
            throw new ApiException("Convite não encontrado", 404);

        if (plan.InviteExpiresAt is null || plan.InviteExpiresAt < DateTime.UtcNow)
            throw new ApiException("Convite expirado", 400);

        if (plan.UserId == userId)
            throw new ApiException("Você não pode aceitar um convite para o seu próprio plano", 400);

        if (plan.SharedWithUserId is not null)
            throw new ApiException("Este plano já está compartilhado com alguém", 400);

        plan.SharedWithUserId = userId;
        plan.CanEdit = plan.InviteCanEdit;
        plan.SharedAt = DateTime.UtcNow;

        plan.InviteToken = null;
        plan.InviteCanEdit = false;
        plan.InviteExpiresAt = null;

        await db.SaveChangesAsync();
        return plan.Id;
    }

    public async Task UpdateSharePermissionAsync(Guid planId, Guid userId, bool canEdit)
    {
        var plan = await GetOwnedPlanAsync(planId, userId);

        if (plan.SharedWithUserId is null)
            throw new ApiException("Este plano não está compartilhado com ninguém", 400);

        plan.CanEdit = canEdit;
        await db.SaveChangesAsync();
    }

    public async Task RemoveShareAsync(Guid planId, Guid userId)
    {
        var plan = await GetOwnedPlanAsync(planId, userId);

        if (plan.SharedWithUserId is null)
            throw new ApiException("Este plano não está compartilhado com ninguém", 400);

        ClearShareFields(plan);
        await db.SaveChangesAsync();
    }

    public async Task LeaveShareAsync(Guid planId, Guid userId)
    {
        var plan = await db.MealPlans.FindAsync(planId);
        if (plan is null)
            throw new ApiException("Plano alimentar não encontrado", 404);
        if (plan.SharedWithUserId != userId)
            throw new ApiException("Você não tem acesso a este plano", 403);

        ClearShareFields(plan);
        await db.SaveChangesAsync();
    }

    private async Task<Models.MealPlan> GetOwnedPlanAsync(Guid planId, Guid userId)
    {
        var plan = await db.MealPlans.FindAsync(planId);
        if (plan is null)
            throw new ApiException("Plano alimentar não encontrado", 404);
        if (plan.UserId != userId)
            throw new ApiException("Acesso negado", 403);
        return plan;
    }

    private static void ClearShareFields(Models.MealPlan plan)
    {
        plan.SharedWithUserId = null;
        plan.CanEdit = false;
        plan.SharedAt = null;
    }

    private static string GenerateToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(24);
        return Convert.ToBase64String(bytes).Replace('+', '-').Replace('/', '_').TrimEnd('=');
    }
}
