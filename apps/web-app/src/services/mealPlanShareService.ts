import { api } from '@/lib/api';
import { InvitePreview, MealPlanInviteInfo } from '@/types';

interface ApiInviteResponse {
  token: string;
  expiresAt: string;
  inviteUrl: string;
  canEdit: boolean;
}

interface ApiInvitePreview {
  planId: string;
  planName: string;
  planGoal: string;
  dailyCalories: number;
  slotCount: number;
  ownerName: string;
  canEdit: boolean;
}

export const mealPlanShareService = {
  async generateInvite(planId: string, canEdit: boolean): Promise<MealPlanInviteInfo> {
    const res = await api.post<ApiInviteResponse>(`/api/meal-plans/${planId}/sharing/invite`, { canEdit });
    return { ...res, expiresAt: new Date(res.expiresAt) };
  },

  async revokeInvite(planId: string): Promise<void> {
    await api.delete(`/api/meal-plans/${planId}/sharing/invite`);
  },

  async updatePermission(planId: string, canEdit: boolean): Promise<void> {
    await api.patch(`/api/meal-plans/${planId}/sharing/permission`, { canEdit });
  },

  async removeSharedUser(planId: string): Promise<void> {
    await api.delete(`/api/meal-plans/${planId}/sharing/shared-user`);
  },

  async leaveShare(planId: string): Promise<void> {
    await api.delete(`/api/meal-plans/${planId}/sharing/leave`);
  },

  async getInviteInfo(token: string): Promise<InvitePreview> {
    return api.get<ApiInvitePreview>(`/api/invites/${token}`);
  },

  async acceptInvite(token: string): Promise<{ planId: string }> {
    return api.post<{ planId: string }>(`/api/invites/${token}/accept`, {});
  },
};
