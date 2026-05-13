import { api } from '@/lib/api';
import { ShoppingList, ShoppingListSummary, ShoppingListInvite } from '@/types';

export const shoppingListService = {
  async getAll(): Promise<ShoppingListSummary[]> {
    return api.get<ShoppingListSummary[]>('/api/shopping-lists');
  },

  async getById(id: string): Promise<ShoppingList> {
    return api.get<ShoppingList>(`/api/shopping-lists/${id}`);
  },

  async create(name: string): Promise<ShoppingList> {
    return api.post<ShoppingList>('/api/shopping-lists', { name });
  },

  async update(id: string, updates: { name?: string }): Promise<ShoppingList> {
    return api.patch<ShoppingList>(`/api/shopping-lists/${id}`, updates);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/shopping-lists/${id}`);
  },

  async setMeals(id: string, mealIds: string[]): Promise<ShoppingList> {
    return api.put<ShoppingList>(`/api/shopping-lists/${id}/meals`, { mealIds });
  },

  async generateInvite(id: string): Promise<ShoppingListInvite> {
    return api.post<ShoppingListInvite>(`/api/shopping-lists/${id}/invite`);
  },

  async revokeInvite(id: string): Promise<void> {
    await api.delete(`/api/shopping-lists/${id}/invite`);
  },

  async acceptInvite(token: string): Promise<ShoppingList> {
    return api.post<ShoppingList>(`/api/shopping-lists/accept/${token}`);
  },

  async leave(id: string): Promise<void> {
    await api.post(`/api/shopping-lists/${id}/leave`);
  },

  async removeMember(id: string, memberUserId: string): Promise<void> {
    await api.delete(`/api/shopping-lists/${id}/members/${memberUserId}`);
  },
};
