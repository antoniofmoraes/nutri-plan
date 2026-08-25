namespace NutriPlan.Api.DTOs;

/// Escopo do que uma entrada de undo cobre. O tipo determina como capturar e restaurar.
public enum UndoKind
{
    Meals,
    PresetMeals,
    MealPlans,
    Foods,
}

// `null` em Name/Foods significa "não existia" — desfazer uma criação apaga a entidade.
public record MealFoodState(Guid Id, Guid FoodId, double Quantity);

public record MealState(Guid Id, Guid MealSlotId, bool IsCheat, List<MealFoodState> Foods);

public record PresetMealState(Guid Id, string? Name, List<MealFoodState>? Foods);

public record FoodState(
    Guid Id,
    string? Name,
    double Calories,
    double Protein,
    double Carbs,
    double Fat,
    double Fibers,
    string Portion
);

public record MealSlotState(Guid Id, string Name, string? Time, int SortOrder);

public record DayPlanState(Guid Id, string Day, List<MealState> Meals);

public record MealPlanState(
    Guid Id,
    string? Name,
    string Goal,
    int DailyCalories,
    int? DailyProtein,
    int? DailyCarbs,
    int? DailyFat,
    bool IsMain,
    List<MealSlotState> Slots,
    List<DayPlanState> Days
);

public record UndoSnapshot(
    UndoKind Kind,
    List<MealState>? Meals = null,
    List<PresetMealState>? PresetMeals = null,
    List<MealPlanState>? MealPlans = null,
    List<FoodState>? Foods = null
);

public record UndoResponse(string Message, List<string> InvalidatedDomains);
