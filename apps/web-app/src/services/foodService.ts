import { api, apiUndo, type WithUndo } from '@/lib/api';
import { Food } from '@/types';

interface CreateFoodInput {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibers: number;
  portion?: string;
}

interface UpdateFoodInput {
  name?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fibers?: number;
  portion?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export const foodService = {
  async getAll(params?: { search?: string; page?: number; pageSize?: number }): Promise<PaginatedResponse<Food>> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    const query = searchParams.toString();
    return api.get<PaginatedResponse<Food>>(`/api/foods${query ? `?${query}` : ''}`);
  },

  async getById(id: string): Promise<Food> {
    return api.get<Food>(`/api/foods/${id}`);
  },

  async create(input: CreateFoodInput): Promise<WithUndo<Food>> {
    return apiUndo.post<Food>('/api/foods', input);
  },

  async update(id: string, input: UpdateFoodInput): Promise<WithUndo<Food>> {
    return apiUndo.patch<Food>(`/api/foods/${id}`, input);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/foods/${id}`);
  },
};
