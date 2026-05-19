import type { Meal, DayPlan, MealPlan, MacroSummary } from "@/types";

const ZERO: MacroSummary = { calories: 0, protein: 0, carbs: 0, fat: 0 };

export function calculateRawMealMacros(meal: Meal): MacroSummary {
  return meal.foods.reduce(
    (acc, { food, quantity }) => ({
      calories: acc.calories + (food.calories * quantity) / 100,
      protein: acc.protein + (food.protein * quantity) / 100,
      carbs: acc.carbs + (food.carbs * quantity) / 100,
      fat: acc.fat + (food.fat * quantity) / 100,
    }),
    { ...ZERO }
  );
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
  const total = plan.days.reduce(
    (acc, day) => {
      for (const meal of day.meals) {
        if (meal.isCheat) continue;
        const macros = calculateRawMealMacros(meal);
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
