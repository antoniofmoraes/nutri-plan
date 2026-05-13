using System.ComponentModel.DataAnnotations;

namespace NutriPlan.Api.DTOs;

public record CreateShoppingListRequest
{
    [Required(ErrorMessage = "Nome é obrigatório")]
    [MinLength(1)]
    public required string Name { get; init; }
}

public record UpdateShoppingListRequest
{
    [MinLength(1)]
    public string? Name { get; init; }

    public List<Guid>? MealIds { get; init; }
}

public record SetShoppingListMealsRequest
{
    [Required]
    public required List<Guid> MealIds { get; init; }
}

public record ShoppingListResponse(
    Guid Id,
    string Name,
    Guid OwnerId,
    string OwnerName,
    bool IsOwner,
    List<ShoppingListMemberResponse> Members,
    List<Guid> SelectedMealIds,
    List<ShoppingListItemResponse> Items,
    string? InviteToken,
    DateTime? InviteExpiresAt,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record ShoppingListSummaryResponse(
    Guid Id,
    string Name,
    Guid OwnerId,
    string OwnerName,
    bool IsOwner,
    int MealCount,
    int MemberCount,
    DateTime UpdatedAt
);

public record ShoppingListMemberResponse(Guid UserId, string Name, string Email, DateTime JoinedAt);

public record ShoppingListItemResponse(Guid FoodId, string FoodName, double Quantity, string Unit);

public record ShoppingListInviteResponse(string Token, DateTime ExpiresAt, string Url);
