import type { Meal, MealPlan, DayPlan, WeekDay } from '@/types';

export const weekDays: { value: WeekDay; label: string; short: string }[] = [
  { value: 'segunda', label: 'Segunda', short: 'Seg' },
  { value: 'terca', label: 'Terça', short: 'Ter' },
  { value: 'quarta', label: 'Quarta', short: 'Qua' },
  { value: 'quinta', label: 'Quinta', short: 'Qui' },
  { value: 'sexta', label: 'Sexta', short: 'Sex' },
  { value: 'sabado', label: 'Sábado', short: 'Sáb' },
  { value: 'domingo', label: 'Domingo', short: 'Dom' },
];

export interface MacroResult {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface ViewProps {
  plan: MealPlan;
  onAddFood: (mealId: string) => void;
  onRemoveFood: (mealId: string, foodId: string) => void;
  onToggleCheat: (mealId: string, currentlyCheat: boolean) => void;
  calculateDayMacros: (day: DayPlan) => MacroResult;
  calculateMealMacros: (meal: Meal) => MacroResult;
}
