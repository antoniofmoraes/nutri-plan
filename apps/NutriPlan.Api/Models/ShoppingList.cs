using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace NutriPlan.Api.Models;

[Table("shopping_lists")]
public class ShoppingList
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("name")]
    public required string Name { get; set; }

    [Column("ownerId")]
    public Guid OwnerId { get; set; }

    [JsonIgnore]
    public User Owner { get; set; } = null!;

    [Column("inviteToken")]
    public string? InviteToken { get; set; }

    [Column("inviteExpiresAt")]
    public DateTime? InviteExpiresAt { get; set; }

    [Column("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ShoppingListMember> Members { get; set; } = [];
    public ICollection<ShoppingListMeal> Meals { get; set; } = [];
}

[Table("shopping_list_members")]
public class ShoppingListMember
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("shoppingListId")]
    public Guid ShoppingListId { get; set; }

    [JsonIgnore]
    public ShoppingList ShoppingList { get; set; } = null!;

    [Column("userId")]
    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    [Column("joinedAt")]
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}

[Table("shopping_list_meals")]
public class ShoppingListMeal
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("shoppingListId")]
    public Guid ShoppingListId { get; set; }

    [JsonIgnore]
    public ShoppingList ShoppingList { get; set; } = null!;

    [Column("mealId")]
    public Guid MealId { get; set; }

    public Meal Meal { get; set; } = null!;
}
