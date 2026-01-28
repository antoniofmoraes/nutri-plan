import { api } from '@/lib/api';
import { MealPlan, Meal, WeekDay, Food } from '@/types';

// API response types (backend format)
interface ApiMealFood {
  id: string;
  quantity: number;
  food: Food;
}

interface ApiMeal {
  id: string;
  name: string;
  time?: string;
  foods: ApiMealFood[];
}

interface ApiDayPlan {
  id: string;
  day: WeekDay;
  meals: ApiMeal[];
}

interface ApiMealPlan {
  id: string;
  name: string;
  goal: 'emagrecer' | 'manter' | 'ganhar';
  dailyCalories: number;
  dailyProtein?: number | null;
  dailyCarbs?: number | null;
  dailyFat?: number | null;
  days: ApiDayPlan[];
  createdAt: string;
  updatedAt: string;
}

// Transform API response to frontend format
function transformMealPlan(apiPlan: ApiMealPlan): MealPlan {
  return {
    id: apiPlan.id,
    name: apiPlan.name,
    goal: apiPlan.goal,
    dailyCalories: apiPlan.dailyCalories,
    dailyProtein: apiPlan.dailyProtein,
    dailyCarbs: apiPlan.dailyCarbs,
    dailyFat: apiPlan.dailyFat,
    days: apiPlan.days.map((day) => ({
      day: day.day,
      meals: day.meals.map((meal) => ({
        id: meal.id,
        name: meal.name,
        time: meal.time,
        foods: meal.foods.map((mf) => ({
          food: mf.food,
          quantity: mf.quantity,
        })),
      })),
    })),
    createdAt: new Date(apiPlan.createdAt),
    updatedAt: new Date(apiPlan.updatedAt),
  };
}

interface CreateMealPlanInput {
  name: string;
  goal: 'emagrecer' | 'manter' | 'ganhar';
  dailyCalories: number;
  dailyProtein?: number | null;
  dailyCarbs?: number | null;
  dailyFat?: number | null;
}

interface UpdateMealPlanInput {
  name?: string;
  goal?: 'emagrecer' | 'manter' | 'ganhar';
  dailyCalories?: number;
  dailyProtein?: number | null;
  dailyCarbs?: number | null;
  dailyFat?: number | null;
}

interface CreateMealInput {
  name: string;
  time?: string;
}

interface UpdateMealInput {
  name?: string;
  time?: string;
}

interface AddFoodToMealInput {
  foodId: string;
  quantity: number;
}

export const mealPlanService = {
  async getAll(): Promise<MealPlan[]> {
    const plans = await api.get<ApiMealPlan[]>('/api/meal-plans');
    return plans.map(transformMealPlan);
  },

  async getById(id: string): Promise<MealPlan> {
    const plan = await api.get<ApiMealPlan>(`/api/meal-plans/${id}`);
    return transformMealPlan(plan);
  },

  async create(input: CreateMealPlanInput): Promise<MealPlan> {
    const plan = await api.post<ApiMealPlan>('/api/meal-plans', input);
    return transformMealPlan(plan);
  },

  async update(id: string, input: UpdateMealPlanInput): Promise<MealPlan> {
    const plan = await api.patch<ApiMealPlan>(`/api/meal-plans/${id}`, input);
    return transformMealPlan(plan);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/meal-plans/${id}`);
  },

  // Meal operations
  async addMeal(planId: string, day: WeekDay, input: CreateMealInput): Promise<Meal> {
    const meal = await api.post<ApiMeal>(
      `/api/meal-plans/${planId}/days/${day}/meals`,
      input
    );
    return {
      id: meal.id,
      name: meal.name,
      time: meal.time,
      foods: meal.foods.map((mf) => ({
        food: mf.food,
        quantity: mf.quantity,
      })),
    };
  },

  async updateMeal(
    planId: string,
    day: WeekDay,
    mealId: string,
    input: UpdateMealInput
  ): Promise<Meal> {
    const meal = await api.patch<ApiMeal>(
      `/api/meal-plans/${planId}/days/${day}/meals/${mealId}`,
      input
    );
    return {
      id: meal.id,
      name: meal.name,
      time: meal.time,
      foods: meal.foods.map((mf) => ({
        food: mf.food,
        quantity: mf.quantity,
      })),
    };
  },

  async deleteMeal(planId: string, day: WeekDay, mealId: string): Promise<void> {
    await api.delete(`/api/meal-plans/${planId}/days/${day}/meals/${mealId}`);
  },

  // Meal food operations
  async addFoodToMeal(mealId: string, input: AddFoodToMealInput): Promise<void> {
    await api.post(`/api/meals/${mealId}/foods`, input);
  },

  async removeFoodFromMeal(mealId: string, foodId: string): Promise<void> {
    await api.delete(`/api/meals/${mealId}/foods/${foodId}`);
  },
};
