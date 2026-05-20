using Microsoft.EntityFrameworkCore;
using NutriPlan.Api.Models;

namespace NutriPlan.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Food> Foods => Set<Food>();
    public DbSet<MealPlan> MealPlans => Set<MealPlan>();
    public DbSet<DayPlan> DayPlans => Set<DayPlan>();
    public DbSet<MealSlot> MealSlots => Set<MealSlot>();
    public DbSet<Meal> Meals => Set<Meal>();
    public DbSet<MealFood> MealFoods => Set<MealFood>();
    public DbSet<ShoppingList> ShoppingLists => Set<ShoppingList>();
    public DbSet<ShoppingListMember> ShoppingListMembers => Set<ShoppingListMember>();
    public DbSet<ShoppingListMeal> ShoppingListMeals => Set<ShoppingListMeal>();
    public DbSet<PresetMeal> PresetMeals => Set<PresetMeal>();
    public DbSet<PresetMealFood> PresetMealFoods => Set<PresetMealFood>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasIndex(u => u.GoogleId).IsUnique().HasFilter("\"googleId\" IS NOT NULL");
            entity.HasOne(u => u.MainMealPlan)
                .WithOne()
                .HasForeignKey<User>(u => u.MainMealPlanId)
                .OnDelete(DeleteBehavior.SetNull);
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

        modelBuilder.Entity<MealSlot>(entity =>
        {
            entity.HasOne(s => s.MealPlan)
                .WithMany(mp => mp.Slots)
                .HasForeignKey(s => s.MealPlanId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Meal>(entity =>
        {
            entity.HasIndex(m => new { m.DayPlanId, m.MealSlotId }).IsUnique();
            entity.HasOne(m => m.DayPlan)
                .WithMany(dp => dp.Meals)
                .HasForeignKey(m => m.DayPlanId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(m => m.MealSlot)
                .WithMany(s => s.Meals)
                .HasForeignKey(m => m.MealSlotId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ShoppingList>(entity =>
        {
            entity.HasIndex(sl => sl.InviteToken).IsUnique().HasFilter("\"inviteToken\" IS NOT NULL");
            entity.HasOne(sl => sl.Owner)
                .WithMany()
                .HasForeignKey(sl => sl.OwnerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ShoppingListMember>(entity =>
        {
            entity.HasIndex(m => new { m.ShoppingListId, m.UserId }).IsUnique();
            entity.HasOne(m => m.ShoppingList)
                .WithMany(sl => sl.Members)
                .HasForeignKey(m => m.ShoppingListId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(m => m.User)
                .WithMany()
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ShoppingListMeal>(entity =>
        {
            entity.HasIndex(slm => new { slm.ShoppingListId, slm.MealId }).IsUnique();
            entity.HasOne(slm => slm.ShoppingList)
                .WithMany(sl => sl.Meals)
                .HasForeignKey(slm => slm.ShoppingListId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(slm => slm.Meal)
                .WithMany()
                .HasForeignKey(slm => slm.MealId)
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

        modelBuilder.Entity<PresetMeal>(entity =>
        {
            entity.HasOne(pm => pm.User)
                .WithMany(u => u.PresetMeals)
                .HasForeignKey(pm => pm.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PresetMealFood>(entity =>
        {
            entity.HasIndex(pmf => new { pmf.PresetMealId, pmf.FoodId }).IsUnique();
            entity.HasOne(pmf => pmf.PresetMeal)
                .WithMany(pm => pm.Foods)
                .HasForeignKey(pmf => pmf.PresetMealId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(pmf => pmf.Food)
                .WithMany(f => f.PresetMealFoods)
                .HasForeignKey(pmf => pmf.FoodId)
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
            else if (entry.Entity is ShoppingList list)
            {
                list.UpdatedAt = DateTime.UtcNow;
                if (entry.State == EntityState.Added)
                    list.CreatedAt = DateTime.UtcNow;
            }
            else if (entry.Entity is PresetMeal preset)
            {
                preset.UpdatedAt = DateTime.UtcNow;
                if (entry.State == EntityState.Added)
                    preset.CreatedAt = DateTime.UtcNow;
            }
        }
    }
}
