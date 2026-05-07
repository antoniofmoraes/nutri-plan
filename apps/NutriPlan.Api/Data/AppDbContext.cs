using Microsoft.EntityFrameworkCore;
using NutriPlan.Api.Models;

namespace NutriPlan.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Food> Foods => Set<Food>();
    public DbSet<MealPlan> MealPlans => Set<MealPlan>();
    public DbSet<DayPlan> DayPlans => Set<DayPlan>();
    public DbSet<Meal> Meals => Set<Meal>();
    public DbSet<MealFood> MealFoods => Set<MealFood>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasIndex(u => u.GoogleId).IsUnique().HasFilter("\"googleId\" IS NOT NULL");
        });

        modelBuilder.Entity<MealPlan>(entity =>
        {
            entity.HasOne(mp => mp.User)
                .WithMany(u => u.MealPlans)
                .HasForeignKey(mp => mp.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DayPlan>(entity =>
        {
            entity.HasIndex(dp => new { dp.MealPlanId, dp.Day }).IsUnique();
            entity.HasOne(dp => dp.MealPlan)
                .WithMany(mp => mp.Days)
                .HasForeignKey(dp => dp.MealPlanId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Meal>(entity =>
        {
            entity.HasOne(m => m.DayPlan)
                .WithMany(dp => dp.Meals)
                .HasForeignKey(m => m.DayPlanId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MealFood>(entity =>
        {
            entity.HasIndex(mf => new { mf.MealId, mf.FoodId }).IsUnique();
            entity.HasOne(mf => mf.Meal)
                .WithMany(m => m.Foods)
                .HasForeignKey(mf => mf.MealId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(mf => mf.Food)
                .WithMany(f => f.MealFoods)
                .HasForeignKey(mf => mf.FoodId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.State is EntityState.Added or EntityState.Modified);

        foreach (var entry in entries)
        {
            if (entry.Entity is User user)
            {
                user.UpdatedAt = DateTime.UtcNow;
                if (entry.State == EntityState.Added)
                    user.CreatedAt = DateTime.UtcNow;
            }
            else if (entry.Entity is MealPlan plan)
            {
                plan.UpdatedAt = DateTime.UtcNow;
                if (entry.State == EntityState.Added)
                    plan.CreatedAt = DateTime.UtcNow;
            }
        }
    }
}
