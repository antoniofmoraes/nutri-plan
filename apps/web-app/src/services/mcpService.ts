import { api } from '@/lib/api';

export interface McpMealPlanAccess {
  planId: string;
  planName: string;
  canRead: boolean;
  canEdit: boolean;
  canGrantEdit: boolean;
  updatedAt?: string | null;
}

export type McpAccessMode = 'off' | 'read' | 'edit';

export const mcpService = {
  getMealPlanAccess(): Promise<McpMealPlanAccess[]> {
    return api.get<McpMealPlanAccess[]>('/api/mcp/meal-plan-access');
  },

  async setMealPlanAccess(planId: string, mode: McpAccessMode): Promise<McpMealPlanAccess> {
    if (mode === 'off') {
      await api.delete(`/api/mcp/meal-plan-access/${planId}`);
      return {
        planId,
        planName: '',
        canRead: false,
        canEdit: false,
        canGrantEdit: false,
        updatedAt: null,
      };
    }

    return api.put<McpMealPlanAccess>(`/api/mcp/meal-plan-access/${planId}`, {
      canRead: true,
      canEdit: mode === 'edit',
    });
  },
};
