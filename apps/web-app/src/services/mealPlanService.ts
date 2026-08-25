import { api, apiUndo, getToken, type WithUndo } from '@/lib/api';
import { MealPlan, MealSlot, WeekDay, Food } from '@/types';

interface ApiMealFood {
  id: string;
  quantity: number;
  food: Food;
}

interface ApiMeal {
  id: string;
  slotId: string;
  name: string;
  time?: string;
  isCheat: boolean;
  foods: ApiMealFood[];
}

interface ApiMealSlot {
  id: string;
  name: string;
  time?: string;
  sortOrder: number;
}

interface ApiDayPlan {
  day: WeekDay;
  meals: ApiMeal[];
}

interface ApiShareInfo {
  userId: string;
  userName: string;
  canEdit: boolean;
  sharedAt: string;
}

interface ApiInviteInfo {
  token: string;
  expiresAt: string;
  inviteUrl: string;
  canEdit: boolean;
}

interface ApiMealPlan {
  id: string;
  name: string;
  goal: 'emagrecer' | 'manter' | 'ganhar';
  dailyCalories: number;
  dailyProtein?: number | null;
  dailyCarbs?: number | null;
  dailyFat?: number | null;
  isMain: boolean;
  role: 'owner' | 'shared';
  canEdit: boolean;
  ownerName?: string | null;
  sharedWith?: ApiShareInfo | null;
  activeInvite?: ApiInviteInfo | null;
  slots: ApiMealSlot[];
  days: ApiDayPlan[];
  createdAt: string;
  updatedAt: string;
}

function transformMealPlan(apiPlan: ApiMealPlan): MealPlan {
  return {
    id: apiPlan.id,
    name: apiPlan.name,
    goal: apiPlan.goal,
    dailyCalories: apiPlan.dailyCalories,
    dailyProtein: apiPlan.dailyProtein,
    dailyCarbs: apiPlan.dailyCarbs,
    dailyFat: apiPlan.dailyFat,
    isMain: apiPlan.isMain,
    role: apiPlan.role,
    canEdit: apiPlan.canEdit,
    ownerName: apiPlan.ownerName,
    sharedWith: apiPlan.sharedWith ? {
      ...apiPlan.sharedWith,
      sharedAt: new Date(apiPlan.sharedWith.sharedAt),
    } : null,
    activeInvite: apiPlan.activeInvite ? {
      ...apiPlan.activeInvite,
      expiresAt: new Date(apiPlan.activeInvite.expiresAt),
    } : null,
    slots: apiPlan.slots,
    days: apiPlan.days.map((day) => ({
      day: day.day,
      meals: day.meals.map((meal) => ({
        id: meal.id,
        slotId: meal.slotId,
        name: meal.name,
        time: meal.time,
        isCheat: meal.isCheat,
        foods: meal.foods.map((mf) => ({
          id: mf.id,
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

interface CreateSlotInput {
  name: string;
  time?: string;
}

interface UpdateSlotInput {
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

  async create(input: CreateMealPlanInput): Promise<WithUndo<MealPlan>> {
    const { data, undoToken } = await apiUndo.post<ApiMealPlan>('/api/meal-plans', input);
    return { data: transformMealPlan(data), undoToken };
  },

  async update(id: string, input: UpdateMealPlanInput): Promise<WithUndo<MealPlan>> {
    const { data, undoToken } = await apiUndo.patch<ApiMealPlan>(`/api/meal-plans/${id}`, input);
    return { data: transformMealPlan(data), undoToken };
  },

  async delete(id: string): Promise<WithUndo<void>> {
    return apiUndo.delete(`/api/meal-plans/${id}`);
  },

  async setMainPlan(planId: string | null): Promise<void> {
    await api.put('/api/users/me/main-plan', { planId });
  },

  // Slot operations (plan-level)
  async addSlot(planId: string, input: CreateSlotInput): Promise<WithUndo<MealSlot>> {
    return apiUndo.post<MealSlot>(`/api/meal-plans/${planId}/slots`, input);
  },

  async updateSlot(planId: string, slotId: string, input: UpdateSlotInput): Promise<WithUndo<MealSlot>> {
    return apiUndo.patch<MealSlot>(`/api/meal-plans/${planId}/slots/${slotId}`, input);
  },

  async deleteSlot(planId: string, slotId: string): Promise<WithUndo<void>> {
    return apiUndo.delete(`/api/meal-plans/${planId}/slots/${slotId}`);
  },

  async reorderSlots(planId: string, slotIds: string[]): Promise<WithUndo<void>> {
    return apiUndo.put(`/api/meal-plans/${planId}/slots/order`, { slotIds });
  },

  async setMealCheat(mealId: string, isCheat: boolean): Promise<WithUndo<void>> {
    return apiUndo.patch(`/api/meals/${mealId}/cheat`, { isCheat });
  },

  async copyMeal(mealId: string, targetMealIds: string[]): Promise<WithUndo<void>> {
    return apiUndo.post(`/api/meals/${mealId}/copy`, { targetMealIds });
  },

  // Meal food operations
  async addFoodToMeal(mealId: string, input: AddFoodToMealInput): Promise<WithUndo<void>> {
    return apiUndo.post(`/api/meals/${mealId}/foods`, input);
  },

  async removeFoodFromMeal(mealId: string, foodId: string): Promise<WithUndo<void>> {
    return apiUndo.delete(`/api/meals/${mealId}/foods/${foodId}`);
  },

  async updateMealFood(mealId: string, foodId: string, updates: { newFoodId?: string; quantity?: number }): Promise<WithUndo<void>> {
    return apiUndo.patch(`/api/meals/${mealId}/foods/${foodId}`, updates);
  },

  async copyMarkdownExport(planId: string): Promise<void> {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const token = getToken();
    const response = await fetch(`${apiUrl}/api/meal-plans/${planId}/export?format=md`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error('Erro ao exportar plano');
    const text = await response.text();
    await navigator.clipboard.writeText(text);
  },

  async downloadExport(planId: string, planName: string, format: 'md' | 'docx' | 'pdf'): Promise<void> {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const token = getToken();
    const response = await fetch(`${apiUrl}/api/meal-plans/${planId}/export?format=${format}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error('Erro ao exportar plano');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${planName}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
