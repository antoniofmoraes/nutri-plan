namespace NutriPlan.Api.DTOs;

public record CreateInviteRequest
{
    public bool CanEdit { get; init; }
}

public record UpdateSharePermissionRequest
{
    public bool CanEdit { get; init; }
}

public record MealPlanInviteResponse(string Token, DateTime ExpiresAt, string InviteUrl, bool CanEdit);

public record ShareInfoResponse(Guid UserId, string UserName, bool CanEdit, DateTime SharedAt);

public record InviteInfoResponse(
    Guid PlanId,
    string PlanName,
    string PlanGoal,
    int DailyCalories,
    int SlotCount,
    string OwnerName,
    bool CanEdit
);
