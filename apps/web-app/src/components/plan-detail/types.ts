import type { Meal, MealPlan, DayPlan } from '@/types';

export { weekDays } from '@/lib/constants';

export interface MacroResult {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface ViewProps {
  plan: MealPlan;
  readOnly?: boolean;
  onAddFood: (mealId: string) => void;
  onRemoveFood: (mealId: string, foodId: string) => void;
  onToggleCheat: (mealId: string, currentlyCheat: boolean) => void;
  calculateDayMacros: (day: DayPlan) => MacroResult;
  calculateMealMacros: (meal: Meal) => MacroResult;
}
