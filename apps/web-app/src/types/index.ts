export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion?: string;
}

export interface MealFood {
  food: Food;
  quantity: number;
}

export interface Meal {
  id: string;
  name: string;
  time?: string;
  foods: MealFood[];
}

export interface DayPlan {
  day: WeekDay;
  meals: Meal[];
}

export type WeekDay = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo';

export type PlanGoal = 'emagrecer' | 'manter' | 'ganhar';

export interface MealPlan {
  id: string;
  name: string;
  goal: PlanGoal;
  dailyCalories: number;
  dailyProtein?: number | null;
  dailyCarbs?: number | null;
  dailyFat?: number | null;
  days: DayPlan[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MacroSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
