import { api, apiUndo, type WithUndo } from '@/lib/api';
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

  async create(name: string): Promise<WithUndo<PresetMeal>> {
    const { data, undoToken } = await apiUndo.post<ApiPresetMeal>('/api/preset-meals', { name });
    return { data: transform(data), undoToken };
  },

  async update(id: string, name: string): Promise<WithUndo<PresetMeal>> {
    const { data, undoToken } = await apiUndo.patch<ApiPresetMeal>(`/api/preset-meals/${id}`, { name });
    return { data: transform(data), undoToken };
  },

  async duplicate(id: string): Promise<WithUndo<PresetMeal>> {
    const { data, undoToken } = await apiUndo.post<ApiPresetMeal>(`/api/preset-meals/${id}/duplicate`, {});
    return { data: transform(data), undoToken };
  },

  async delete(id: string): Promise<WithUndo<void>> {
    return apiUndo.delete(`/api/preset-meals/${id}`);
  },

  async addFood(presetId: string, foodId: string, quantity: number): Promise<WithUndo<void>> {
    return apiUndo.post(`/api/preset-meals/${presetId}/foods`, { foodId, quantity });
  },

  async updateFood(presetId: string, foodId: string, updates: { newFoodId?: string; quantity?: number }): Promise<WithUndo<void>> {
    return apiUndo.patch(`/api/preset-meals/${presetId}/foods/${foodId}`, updates);
  },

  async removeFood(presetId: string, foodId: string): Promise<WithUndo<void>> {
    return apiUndo.delete(`/api/preset-meals/${presetId}/foods/${foodId}`);
  },

  async copyFoodsFrom(targetId: string, sourceId: string): Promise<WithUndo<void>> {
    return apiUndo.post(`/api/preset-meals/${targetId}/copy-from/${sourceId}`);
  },

  async apply(presetId: string, targetMealIds: string[]): Promise<WithUndo<void>> {
    return apiUndo.post(`/api/preset-meals/${presetId}/apply`, { targetMealIds });
  },
};
