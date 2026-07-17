import type { Meal, DayPlan, MealPlan, MacroSummary, Food } from "@/types";

const ZERO: MacroSummary = { calories: 0, protein: 0, carbs: 0, fat: 0 };

export function getFoodPortionGrams(portion?: string): number {
  const match = portion?.match(/(\d+(?:[.,]\d+)?)\s*(?:g|grama|gramas)\b/i);
  if (!match) return 100;

  const grams = Number(match[1].replace(",", "."));
  return Number.isFinite(grams) && grams > 0 ? grams : 100;
}

export function calculateFoodMacros(
  food: Pick<Food, "calories" | "protein" | "carbs" | "fat" | "portion">,
  quantity: number
): MacroSummary {
  const ratio = quantity / getFoodPortionGrams(food.portion);
  return {
    calories: food.calories * ratio,
    protein: food.protein * ratio,
    carbs: food.carbs * ratio,
    fat: food.fat * ratio,
  };
}

export function calculateFoodsMacros(
  foods: ReadonlyArray<{
    food: Pick<Food, "calories" | "protein" | "carbs" | "fat" | "portion">;
    quantity: number;
  }>
): MacroSummary {
  return foods.reduce((acc, { food, quantity }) => {
    const macros = calculateFoodMacros(food, quantity);
    acc.calories += macros.calories;
    acc.protein += macros.protein;
    acc.carbs += macros.carbs;
    acc.fat += macros.fat;
    return acc;
  }, { ...ZERO });
}

export function calculateRawMealMacros(meal: Meal): MacroSummary {
  return calculateFoodsMacros(meal.foods);
}

export function buildSlotAverages(plan: MealPlan): Map<string, MacroSummary> {
  const grouped = new Map<string, { sum: MacroSummary; count: number }>();
  for (const day of plan.days) {
    for (const meal of day.meals) {
      if (meal.isCheat) continue;
      const macros = calculateRawMealMacros(meal);
      const entry = grouped.get(meal.slotId) ?? { sum: { ...ZERO }, count: 0 };
      entry.sum.calories += macros.calories;
      entry.sum.protein += macros.protein;
      entry.sum.carbs += macros.carbs;
      entry.sum.fat += macros.fat;
      entry.count += 1;
      grouped.set(meal.slotId, entry);
    }
  }
  const averages = new Map<string, MacroSummary>();
  for (const [slotId, { sum, count }] of grouped) {
    averages.set(slotId, {
      calories: count > 0 ? sum.calories / count : 0,
      protein: count > 0 ? sum.protein / count : 0,
      carbs: count > 0 ? sum.carbs / count : 0,
      fat: count > 0 ? sum.fat / count : 0,
    });
  }
  return averages;
}

export function calculateMealMacros(meal: Meal, plan?: MealPlan): MacroSummary {
  if (meal.isCheat && plan) {
    const averages = buildSlotAverages(plan);
    return averages.get(meal.slotId) ?? { ...ZERO };
  }
  return calculateRawMealMacros(meal);
}

export function calculateDayMacros(dayPlan: DayPlan, plan?: MealPlan): MacroSummary {
  const averages = plan ? buildSlotAverages(plan) : null;
  return dayPlan.meals.reduce(
    (acc, meal) => {
      const mealMacros =
        meal.isCheat && averages
          ? averages.get(meal.slotId) ?? { ...ZERO }
          : calculateRawMealMacros(meal);
      return {
        calories: acc.calories + mealMacros.calories,
        protein: acc.protein + mealMacros.protein,
        carbs: acc.carbs + mealMacros.carbs,
        fat: acc.fat + mealMacros.fat,
      };
    },
    { ...ZERO }
  );
}

export function calculatePlanMacros(plan: MealPlan): MacroSummary {
  const averages = buildSlotAverages(plan);
  const total = plan.days.reduce(
    (acc, day) => {
      for (const meal of day.meals) {
        const macros = meal.isCheat
          ? averages.get(meal.slotId) ?? ZERO
          : calculateRawMealMacros(meal);
        acc.calories += macros.calories;
        acc.protein += macros.protein;
        acc.carbs += macros.carbs;
        acc.fat += macros.fat;
      }
      return acc;
    },
    { ...ZERO }
  );
  return {
    calories: total.calories / 7,
    protein: total.protein / 7,
    carbs: total.carbs / 7,
    fat: total.fat / 7,
  };
}
