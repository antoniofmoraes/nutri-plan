using Microsoft.EntityFrameworkCore;
using NutriPlan.Api.Data;
using NutriPlan.Api.DTOs;
using NutriPlan.Api.Middleware;

namespace NutriPlan.Api.Services;

public class UserService(AppDbContext db)
{
    public async Task<UserWithDateDto> GetUserAsync(Guid userId)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null)
            throw new ApiException("Usuário não encontrado", 404);

        return new UserWithDateDto(user.Id, user.Name, user.Email, user.MainMealPlanId, user.IsAdmin, user.CreatedAt);
    }

    public async Task<UserWithDateDto> UpdateUserAsync(Guid userId, UpdateUserRequest request)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null)
            throw new ApiException("Usuário não encontrado", 404);

        if (request.Email is not null && request.Email != user.Email)
        {
            if (string.IsNullOrEmpty(request.CurrentPassword))
                throw new ApiException("Senha atual é obrigatória para alterar o email", 400);
            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.Password))
                throw new ApiException("Senha atual incorreta", 401);

            var emailTaken = await db.Users.AnyAsync(u => u.Email == request.Email);
            if (emailTaken)
                throw new ApiException("Email já está em uso", 409);
            user.Email = request.Email;
        }

        if (request.Name is not null)
            user.Name = request.Name;

        await db.SaveChangesAsync();
        return new UserWithDateDto(user.Id, user.Name, user.Email, user.MainMealPlanId, user.IsAdmin, user.CreatedAt);
    }

    public async Task<UserWithDateDto> SetMainPlanAsync(Guid userId, Guid? planId)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null)
            throw new ApiException("Usuário não encontrado", 404);

        if (planId.HasValue)
        {
            var plan = await db.MealPlans.FirstOrDefaultAsync(mp => mp.Id == planId.Value && mp.UserId == userId);
            if (plan is null)
                throw new ApiException("Plano alimentar não encontrado", 404);
        }

        user.MainMealPlanId = planId;
        await db.SaveChangesAsync();

        return new UserWithDateDto(user.Id, user.Name, user.Email, user.MainMealPlanId, user.IsAdmin, user.CreatedAt);
    }

    public async Task DeleteUserAsync(Guid userId)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null)
            throw new ApiException("Usuário não encontrado", 404);

        db.Users.Remove(user);
        await db.SaveChangesAsync();
    }
}
