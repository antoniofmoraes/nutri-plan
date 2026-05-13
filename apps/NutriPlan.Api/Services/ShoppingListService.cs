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
        // Lists where user is owner OR member
        var ownedListIds = await db.ShoppingLists
            .Where(sl => sl.OwnerId == userId)
            .Select(sl => sl.Id)
            .ToListAsync();

        var memberListIds = await db.ShoppingListMembers
            .Where(m => m.UserId == userId)
            .Select(m => m.ShoppingListId)
            .ToListAsync();

        var allIds = ownedListIds.Concat(memberListIds).Distinct().ToList();

        var lists = await db.ShoppingLists
            .Include(sl => sl.Owner)
            .Include(sl => sl.Members)
            .Include(sl => sl.Meals)
            .Where(sl => allIds.Contains(sl.Id))
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
        var list = await GetListWithAccessAsync(id, userId);
        return await ToResponseAsync(list, userId);
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

        return await ToResponseAsync(list, userId);
    }

    public async Task<ShoppingListResponse> UpdateAsync(Guid id, Guid userId, UpdateShoppingListRequest request)
    {
        var list = await GetListAsOwnerAsync(id, userId);

        if (request.Name is not null) list.Name = request.Name;

        if (request.MealIds is not null)
            await SetMealsInternalAsync(list, request.MealIds, userId);

        await db.SaveChangesAsync();
        return await ToResponseAsync(list, userId);
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
        var list = await GetListWithAccessAsync(id, userId);
        await SetMealsInternalAsync(list, request.MealIds, userId);
        await db.SaveChangesAsync();
        return await ToResponseAsync(list, userId);
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
        return await GetByIdAsync(list.Id, userId);
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

    private async Task<ShoppingList> GetListWithAccessAsync(Guid id, Guid userId)
    {
        var list = await db.ShoppingLists
            .Include(sl => sl.Owner)
            .Include(sl => sl.Members).ThenInclude(m => m.User)
            .Include(sl => sl.Meals)
            .FirstOrDefaultAsync(sl => sl.Id == id);

        if (list is null)
            throw new ApiException("Lista de compras não encontrada", 404);

        var hasAccess = list.OwnerId == userId || list.Members.Any(m => m.UserId == userId);
        if (!hasAccess)
            throw new ApiException("Acesso negado", 403);

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
        // Validate: all meals must belong to plans the user can access (owner or member)
        var accessibleMealIds = await db.Meals
            .Include(m => m.DayPlan).ThenInclude(dp => dp.MealPlan)
            .Where(m => mealIds.Contains(m.Id) && m.DayPlan.MealPlan.UserId == userId)
            .Select(m => m.Id)
            .ToListAsync();

        var validIds = mealIds.Where(id => accessibleMealIds.Contains(id)).ToList();

        // Remove existing
        db.ShoppingListMeals.RemoveRange(list.Meals);

        // Add new
        foreach (var mealId in validIds.Distinct())
        {
            db.ShoppingListMeals.Add(new ShoppingListMeal
            {
                ShoppingListId = list.Id,
                MealId = mealId
            });
        }
    }

    private async Task<ShoppingListResponse> ToResponseAsync(ShoppingList list, Guid userId)
    {
        // Reload with full graph to compute items
        var fullList = await db.ShoppingLists
            .Include(sl => sl.Owner)
            .Include(sl => sl.Members).ThenInclude(m => m.User)
            .Include(sl => sl.Meals).ThenInclude(slm => slm.Meal)
                .ThenInclude(m => m.MealSlot)
            .Include(sl => sl.Meals).ThenInclude(slm => slm.Meal)
                .ThenInclude(m => m.Foods).ThenInclude(mf => mf.Food)
            .Include(sl => sl.Meals).ThenInclude(slm => slm.Meal)
                .ThenInclude(m => m.DayPlan)
            .FirstAsync(sl => sl.Id == list.Id);

        // Aggregate foods across all selected meals
        var aggregated = fullList.Meals
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
            fullList.Id,
            fullList.Name,
            fullList.OwnerId,
            fullList.Owner.Name,
            fullList.OwnerId == userId,
            fullList.Members.Select(m => new ShoppingListMemberResponse(
                m.UserId, m.User.Name, m.User.Email, m.JoinedAt
            )).ToList(),
            fullList.Meals.Select(slm => slm.MealId).ToList(),
            aggregated,
            fullList.OwnerId == userId ? fullList.InviteToken : null,
            fullList.OwnerId == userId ? fullList.InviteExpiresAt : null,
            fullList.CreatedAt,
            fullList.UpdatedAt
        );
    }

    private static string GenerateToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(24);
        return Convert.ToBase64String(bytes).Replace('+', '-').Replace('/', '_').TrimEnd('=');
    }
}
