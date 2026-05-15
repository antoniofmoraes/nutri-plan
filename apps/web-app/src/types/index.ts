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
  fibers: number;
  portion?: string;
}

export interface MealFood {
  id?: string;
  food: Food;
  quantity: number;
}

export interface MealSlot {
  id: string;
  name: string;
  time?: string;
  sortOrder: number;
}

export interface Meal {
  id: string;
  slotId: string;
  name: string;
  time?: string;
  isCheat: boolean;
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
  slots: MealSlot[];
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

export interface ShoppingListMember {
  userId: string;
  name: string;
  email: string;
  joinedAt: string;
}

export interface ShoppingListItem {
  foodId: string;
  foodName: string;
  quantity: number;
  unit: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  isOwner: boolean;
  members: ShoppingListMember[];
  selectedMealIds: string[];
  items: ShoppingListItem[];
  inviteToken?: string | null;
  inviteExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PresetMealFood {
  id?: string;
  food: Food;
  quantity: number;
}

export interface PresetMeal {
  id: string;
  name: string;
  foods: PresetMealFood[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ShoppingListSummary {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  isOwner: boolean;
  mealCount: number;
  memberCount: number;
  updatedAt: string;
}

export interface ShoppingListInvite {
  token: string;
  expiresAt: string;
  url: string;
}
