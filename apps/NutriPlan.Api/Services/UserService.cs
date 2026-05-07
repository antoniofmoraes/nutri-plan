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

        return new UserWithDateDto(user.Id, user.Name, user.Email, user.CreatedAt);
    }

    public async Task<UserWithDateDto> UpdateUserAsync(Guid userId, UpdateUserRequest request)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null)
            throw new ApiException("Usuário não encontrado", 404);

        if (request.Email is not null && request.Email != user.Email)
        {
            var emailTaken = await db.Users.AnyAsync(u => u.Email == request.Email);
            if (emailTaken)
                throw new ApiException("Email já está em uso", 409);
            user.Email = request.Email;
        }

        if (request.Name is not null)
            user.Name = request.Name;

        await db.SaveChangesAsync();
        return new UserWithDateDto(user.Id, user.Name, user.Email, user.CreatedAt);
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
