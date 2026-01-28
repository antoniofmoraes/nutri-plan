import { api } from '@/lib/api';
import { Food } from '@/types';

interface CreateFoodInput {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion?: string;
}

interface UpdateFoodInput {
  name?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  portion?: string;
}

export const foodService = {
  async getAll(search?: string): Promise<Food[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return api.get<Food[]>(`/api/foods${query}`);
  },

  async getById(id: string): Promise<Food> {
    return api.get<Food>(`/api/foods/${id}`);
  },

  async create(input: CreateFoodInput): Promise<Food> {
    return api.post<Food>('/api/foods', input);
  },

  async update(id: string, input: UpdateFoodInput): Promise<Food> {
    return api.patch<Food>(`/api/foods/${id}`, input);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/foods/${id}`);
  },
};
