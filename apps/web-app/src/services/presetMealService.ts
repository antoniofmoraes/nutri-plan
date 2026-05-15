import { api } from '@/lib/api';
import { PresetMeal, Food } from '@/types';

interface ApiPresetMealFood {
  id: string;
  quantity: number;
  food: Food;
}

interface ApiPresetMeal {
  id: string;
  name: string;
  foods: ApiPresetMealFood[];
  createdAt: string;
  updatedAt: string;
}

function transform(p: ApiPresetMeal): PresetMeal {
  return {
    id: p.id,
    name: p.name,
    foods: p.foods.map(f => ({ id: f.id, food: f.food, quantity: f.quantity })),
    createdAt: new Date(p.createdAt),
    updatedAt: new Date(p.updatedAt),
  };
}

export const presetMealService = {
  async getAll(): Promise<PresetMeal[]> {
    const items = await api.get<ApiPresetMeal[]>('/api/preset-meals');
    return items.map(transform);
  },

  async getById(id: string): Promise<PresetMeal> {
    const item = await api.get<ApiPresetMeal>(`/api/preset-meals/${id}`);
    return transform(item);
  },

  async create(name: string): Promise<PresetMeal> {
    const item = await api.post<ApiPresetMeal>('/api/preset-meals', { name });
    return transform(item);
  },

  async update(id: string, name: string): Promise<PresetMeal> {
    const item = await api.patch<ApiPresetMeal>(`/api/preset-meals/${id}`, { name });
    return transform(item);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/preset-meals/${id}`);
  },

  async addFood(presetId: string, foodId: string, quantity: number): Promise<void> {
    await api.post(`/api/preset-meals/${presetId}/foods`, { foodId, quantity });
  },

  async updateFood(presetId: string, foodId: string, updates: { newFoodId?: string; quantity?: number }): Promise<void> {
    await api.patch(`/api/preset-meals/${presetId}/foods/${foodId}`, updates);
  },

  async removeFood(presetId: string, foodId: string): Promise<void> {
    await api.delete(`/api/preset-meals/${presetId}/foods/${foodId}`);
  },

  async apply(presetId: string, targetMealIds: string[]): Promise<void> {
    await api.post(`/api/preset-meals/${presetId}/apply`, { targetMealIds });
  },
};
