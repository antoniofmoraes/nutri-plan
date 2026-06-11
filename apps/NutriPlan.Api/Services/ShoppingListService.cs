using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using NutriPlan.Api.Data;
using NutriPlan.Api.DTOs;
using NutriPlan.Api.Middleware;
using NutriPlan.Api.Models;

namespace NutriPlan.Api.Services;

public class ShoppingListService(AppDbContext db)
{
    private const int InviteExpirationDays = 3;

    public async Task<List<ShoppingListSummaryResponse>> GetAllForUserAsync(Guid userId)
    {
        var lists = await db.ShoppingLists
            .Include(sl => sl.Owner)
            .Include(sl => sl.Members)
            .Include(sl => sl.Meals)
            .Where(sl => sl.OwnerId == userId || sl.Members.Any(m => m.UserId == userId))
            .OrderByDescending(sl => sl.UpdatedAt)
            .ToListAsync();

        return lists.Select(sl => new ShoppingListSummaryResponse(
            sl.Id,
            sl.Name,
            sl.OwnerId,
            sl.Owner.Name,
            sl.OwnerId == userId,
            sl.Meals.Count,
            sl.Members.Count + 1, // members + owner
            sl.UpdatedAt
        )).ToList();
    }

    public async Task<ShoppingListResponse> GetByIdAsync(Guid id, Guid userId)
    {
        var list = await LoadFullForResponseAsync(id, userId, ownerOnly: false);
        return BuildResponse(list, userId);
    }

    public async Task<ShoppingListResponse> CreateAsync(Guid userId, CreateShoppingListRequest request)
    {
        var list = new ShoppingList
        {
            Name = request.Name,
            OwnerId = userId
        };

        db.ShoppingLists.Add(list);
        await db.SaveChangesAsync();

        var full = await LoadFullForResponseAsync(list.Id, userId, ownerOnly: false);
        return BuildResponse(full, userId);
    }

    public async Task<ShoppingListResponse> UpdateAsync(Guid id, Guid userId, UpdateShoppingListRequest request)
    {
        var list = await LoadFullForResponseAsync(id, userId, ownerOnly: true);

        if (request.Name is not null) list.Name = request.Name;

        if (request.MealIds is not null)
            await SetMealsInternalAsync(list, request.MealIds, userId);

        await db.SaveChangesAsync();
        return BuildResponse(list, userId);
    }

    public async Task DeleteAsync(Guid id, Guid userId)
    {
        var list = await GetListAsOwnerAsync(id, userId);
        db.ShoppingLists.Remove(list);
        await db.SaveChangesAsync();
    }

    public async Task<ShoppingListResponse> SetMealsAsync(Guid id, Guid userId, SetShoppingListMealsRequest request)
    {
        // Both owner and members can change selected meals
        var list = await LoadFullForResponseAsync(id, userId, ownerOnly: false);
        await SetMealsInternalAsync(list, request.MealIds, userId);
        await db.SaveChangesAsync();
        return BuildResponse(list, userId);
    }

    public async Task<ShoppingListInviteResponse> GenerateInviteAsync(Guid id, Guid userId)
    {
        var list = await GetListAsOwnerAsync(id, userId);

        list.InviteToken = GenerateToken();
        list.InviteExpiresAt = DateTime.UtcNow.AddDays(InviteExpirationDays);
        await db.SaveChangesAsync();

        return new ShoppingListInviteResponse(
            list.InviteToken,
            list.InviteExpiresAt.Value,
            $"/listas-compras/aceitar/{list.InviteToken}"
        );
    }

    public async Task RevokeInviteAsync(Guid id, Guid userId)
    {
        var list = await GetListAsOwnerAsync(id, userId);
        list.InviteToken = null;
        list.InviteExpiresAt = null;
        await db.SaveChangesAsync();
    }

    public async Task<ShoppingListResponse> AcceptInviteAsync(string token, Guid userId)
    {
        var list = await db.ShoppingLists
            .Include(sl => sl.Members)
            .FirstOrDefaultAsync(sl => sl.InviteToken == token);

        if (list is null)
            throw new ApiException("Convite inválido", 404);

        if (list.InviteExpiresAt is null || list.InviteExpiresAt < DateTime.UtcNow)
            throw new ApiException("Convite expirado", 400);

        if (list.OwnerId == userId)
            throw new ApiException("Você já é o dono dessa lista", 400);

        if (list.Members.Any(m => m.UserId == userId))
            throw new ApiException("Você já é membro dessa lista", 400);

        db.ShoppingListMembers.Add(new ShoppingListMember
        {
            ShoppingListId = list.Id,
            UserId = userId
        });

        await db.SaveChangesAsync();
        var full = await LoadFullForResponseAsync(list.Id, userId, ownerOnly: false);
        return BuildResponse(full, userId);
    }

    public async Task LeaveAsync(Guid id, Guid userId)
    {
        var member = await db.ShoppingListMembers
            .FirstOrDefaultAsync(m => m.ShoppingListId == id && m.UserId == userId);

        if (member is null)
            throw new ApiException("Você não é membro dessa lista", 404);

        db.ShoppingListMembers.Remove(member);
        await db.SaveChangesAsync();
    }

    public async Task RemoveMemberAsync(Guid id, Guid userId, Guid memberUserId)
    {
        await GetListAsOwnerAsync(id, userId);

        var member = await db.ShoppingListMembers
            .FirstOrDefaultAsync(m => m.ShoppingListId == id && m.UserId == memberUserId);

        if (member is null)
            throw new ApiException("Membro não encontrado", 404);

        db.ShoppingListMembers.Remove(member);
        await db.SaveChangesAsync();
    }

    // ─── Helpers ──────────────────────────────────────────────

    private async Task<ShoppingList> LoadFullForResponseAsync(Guid id, Guid userId, bool ownerOnly)
    {
        var list = await db.ShoppingLists
            .Include(sl => sl.Owner)
            .Include(sl => sl.Members).ThenInclude(m => m.User)
            .Include(sl => sl.Meals).ThenInclude(slm => slm.Meal)
                .ThenInclude(m => m.MealSlot)
            .Include(sl => sl.Meals).ThenInclude(slm => slm.Meal)
                .ThenInclude(m => m.Foods).ThenInclude(mf => mf.Food)
            .Include(sl => sl.Meals).ThenInclude(slm => slm.Meal)
                .ThenInclude(m => m.DayPlan)
            .FirstOrDefaultAsync(sl => sl.Id == id);

        if (list is null)
            throw new ApiException("Lista de compras não encontrada", 404);

        if (ownerOnly)
        {
            if (list.OwnerId != userId)
                throw new ApiException("Apenas o dono pode realizar essa ação", 403);
        }
        else
        {
            var hasAccess = list.OwnerId == userId || list.Members.Any(m => m.UserId == userId);
            if (!hasAccess)
                throw new ApiException("Acesso negado", 403);
        }

        return list;
    }

    private async Task<ShoppingList> GetListAsOwnerAsync(Guid id, Guid userId)
    {
        var list = await db.ShoppingLists
            .Include(sl => sl.Members)
            .Include(sl => sl.Meals)
            .FirstOrDefaultAsync(sl => sl.Id == id);

        if (list is null)
            throw new ApiException("Lista de compras não encontrada", 404);

        if (list.OwnerId != userId)
            throw new ApiException("Apenas o dono pode realizar essa ação", 403);

        return list;
    }

    private async Task SetMealsInternalAsync(ShoppingList list, List<Guid> mealIds, Guid userId)
    {
        // Validate: all meals must belong to plans the user can read (own or shared with them)
        var accessibleMealIds = await db.Meals
            .Where(m => mealIds.Contains(m.Id)
                && (m.DayPlan.MealPlan.UserId == userId || m.DayPlan.MealPlan.SharedWithUserId == userId))
            .Select(m => m.Id)
            .ToListAsync();

        var distinctRequested = mealIds.Distinct().ToList();
        if (accessibleMealIds.Count != distinctRequested.Count)
            throw new ApiException("Refeições inválidas na seleção", 400);

        // Remove existing
        db.ShoppingListMeals.RemoveRange(list.Meals);

        // Add new
        foreach (var mealId in distinctRequested)
        {
            db.ShoppingListMeals.Add(new ShoppingListMeal
            {
                ShoppingListId = list.Id,
                MealId = mealId
            });
        }
    }

    private static ShoppingListResponse BuildResponse(ShoppingList list, Guid userId)
    {
        var aggregated = list.Meals
            .SelectMany(slm => slm.Meal.Foods)
            .GroupBy(mf => mf.FoodId)
            .Select(g => new ShoppingListItemResponse(
                g.Key,
                g.First().Food.Name,
                g.Sum(mf => mf.Quantity),
                "g"
            ))
            .OrderBy(i => i.FoodName)
            .ToList();

        return new ShoppingListResponse(
            list.Id,
            list.Name,
            list.OwnerId,
            list.Owner.Name,
            list.OwnerId == userId,
            list.Members.Select(m => new ShoppingListMemberResponse(
                m.UserId, m.User.Name, m.User.Email, m.JoinedAt
            )).ToList(),
            list.Meals.Select(slm => slm.MealId).ToList(),
            aggregated,
            list.OwnerId == userId ? list.InviteToken : null,
            list.OwnerId == userId ? list.InviteExpiresAt : null,
            list.CreatedAt,
            list.UpdatedAt
        );
    }

    private static string GenerateToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(24);
        return Convert.ToBase64String(bytes).Replace('+', '-').Replace('/', '_').TrimEnd('=');
    }
}
