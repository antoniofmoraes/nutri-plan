import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mealPlanService } from '@/services/mealPlanService';
import { mealPlanShareService } from '@/services/mealPlanShareService';
import { presetMealService } from '@/services/presetMealService';
import { useAuth } from '@/contexts/AuthContext';
import { useUndoToast } from './useUndo';
import { toast } from 'sonner';
import type { Food, PlanGoal } from '@/types';
import { mealPlanKeys } from '@/lib/queryKeys';
import type { WithUndo } from '@/lib/api';

export { mealPlanKeys } from '@/lib/queryKeys';

export function useMealPlans() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const undoToast = useUndoToast();

  const query = useQuery({
    queryKey: mealPlanKeys.lists(),
    queryFn: () => mealPlanService.getAll(),
    enabled: isAuthenticated,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: mealPlanKeys.all });

  const announce = (message: string) => (result: WithUndo<unknown>) => {
    invalidate();
    undoToast(message, result.undoToken);
  };

  const create = useMutation({
    mutationFn: (input: {
      name: string;
      goal: PlanGoal;
      dailyCalories: number;
      dailyProtein?: number | null;
      dailyCarbs?: number | null;
      dailyFat?: number | null;
    }) => mealPlanService.create(input),
    onSuccess: announce('Plano criado'),
  });

  const update = useMutation({
    mutationFn: ({ id, updates }: {
      id: string;
      updates: {
        name?: string;
        goal?: PlanGoal;
        dailyCalories?: number;
        dailyProtein?: number | null;
        dailyCarbs?: number | null;
        dailyFat?: number | null;
      };
    }) => mealPlanService.update(id, updates),
    onSuccess: announce('Plano atualizado'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => mealPlanService.delete(id),
    onSuccess: announce('Plano excluído'),
  });

  const setMain = useMutation({
    mutationFn: (planId: string | null) => mealPlanService.setMainPlan(planId),
    onSuccess: (_r, planId) => { invalidate(); toast.success(planId ? 'Plano definido como principal' : 'Plano principal removido'); },
  });

  return {
    mealPlans: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    addMealPlan: create.mutateAsync,
    updateMealPlan: (id: string, updates: Parameters<typeof update.mutateAsync>[0]['updates']) =>
      update.mutateAsync({ id, updates }),
    deleteMealPlan: remove.mutateAsync,
    setMainPlan: setMain.mutateAsync,
  };
}

export function useMealPlan(id: string | undefined) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const undoToast = useUndoToast();

  const query = useQuery({
    queryKey: mealPlanKeys.detail(id!),
    queryFn: () => mealPlanService.getById(id!),
    enabled: isAuthenticated && !!id,
  });

  const invalidatePlan = () => {
    queryClient.invalidateQueries({ queryKey: mealPlanKeys.detail(id!) });
    queryClient.invalidateQueries({ queryKey: mealPlanKeys.lists() });
  };

  const announcePlan = (message: string) => (result: WithUndo<unknown>) => {
    invalidatePlan();
    undoToast(message, result.undoToken);
  };

  const addSlotMut = useMutation({
    mutationFn: (input: { name: string; time?: string }) =>
      mealPlanService.addSlot(id!, input),
    onSuccess: announcePlan('Refeição adicionada'),
  });

  const updateSlotMut = useMutation({
    mutationFn: ({ slotId, updates }: { slotId: string; updates: { name?: string; time?: string } }) =>
      mealPlanService.updateSlot(id!, slotId, updates),
    onSuccess: announcePlan('Refeição atualizada'),
  });

  const deleteSlotMut = useMutation({
    mutationFn: (slotId: string) => mealPlanService.deleteSlot(id!, slotId),
    onSuccess: announcePlan('Refeição excluída'),
  });

  const reorderSlotsMut = useMutation({
    mutationFn: (slotIds: string[]) => mealPlanService.reorderSlots(id!, slotIds),
    onSuccess: announcePlan('Ordem atualizada'),
  });

  const addFoodToMealMut = useMutation({
    mutationFn: ({ mealId, foodId, quantity }: { mealId: string; foodId: string; quantity: number }) =>
      mealPlanService.addFoodToMeal(mealId, { foodId, quantity }),
    onSuccess: announcePlan('Alimento adicionado'),
  });

  const removeFoodFromMealMut = useMutation({
    mutationFn: ({ mealId, foodId }: { mealId: string; foodId: string }) =>
      mealPlanService.removeFoodFromMeal(mealId, foodId),
    onSuccess: announcePlan('Alimento removido'),
  });

  const updateMealFoodMut = useMutation({
    mutationFn: ({ mealId, foodId, updates }: { mealId: string; foodId: string; updates: { newFoodId?: string; quantity?: number } }) =>
      mealPlanService.updateMealFood(mealId, foodId, updates),
    onSuccess: announcePlan('Alimento atualizado'),
  });

  const setMealCheatMut = useMutation({
    mutationFn: ({ mealId, isCheat }: { mealId: string; isCheat: boolean }) =>
      mealPlanService.setMealCheat(mealId, isCheat),
    onSuccess: (result, { isCheat }) => {
      invalidatePlan();
      undoToast(isCheat ? 'Refeição marcada como livre' : 'Marcação de livre removida', result.undoToken);
    },
  });

  const copyMealMut = useMutation({
    mutationFn: ({ sourceMealId, targetMealIds }: { sourceMealId: string; targetMealIds: string[] }) =>
      mealPlanService.copyMeal(sourceMealId, targetMealIds),
    onSuccess: announcePlan('Refeição copiada'),
  });

  const applyPresetMut = useMutation({
    mutationFn: ({ presetId, targetMealIds }: { presetId: string; targetMealIds: string[] }) =>
      presetMealService.apply(presetId, targetMealIds),
    onSuccess: (result, { targetMealIds }) => {
      invalidatePlan();
      const count = targetMealIds.length;
      undoToast(`Aplicada em ${count} ${count === 1 ? 'refeição' : 'refeições'}`, result.undoToken);
    },
  });

  return {
    plan: query.data,
    isLoading: query.isLoading,
    error: query.error,
    addSlot: addSlotMut.mutateAsync,
    updateSlot: (slotId: string, updates: { name?: string; time?: string }) =>
      updateSlotMut.mutateAsync({ slotId, updates }),
    deleteSlot: deleteSlotMut.mutateAsync,
    reorderSlots: reorderSlotsMut.mutateAsync,
    addFoodToMeal: (mealId: string, food: Food, quantity: number) =>
      addFoodToMealMut.mutateAsync({ mealId, foodId: food.id, quantity }),
    removeFoodFromMeal: (mealId: string, foodId: string) =>
      removeFoodFromMealMut.mutateAsync({ mealId, foodId }),
    updateMealFood: (mealId: string, foodId: string, updates: { newFoodId?: string; quantity?: number }) =>
      updateMealFoodMut.mutateAsync({ mealId, foodId, updates }),
    setMealCheat: (mealId: string, isCheat: boolean) =>
      setMealCheatMut.mutateAsync({ mealId, isCheat }),
    copyMeal: (sourceMealId: string, targetMealIds: string[]) =>
      copyMealMut.mutateAsync({ sourceMealId, targetMealIds }),
    applyPreset: (presetId: string, targetMealIds: string[]) =>
      applyPresetMut.mutateAsync({ presetId, targetMealIds }),
  };
}

export function useMealPlanSharing(planId: string | undefined) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    if (!planId) return;
    queryClient.invalidateQueries({ queryKey: mealPlanKeys.detail(planId) });
    queryClient.invalidateQueries({ queryKey: mealPlanKeys.lists() });
  };

  const generateInvite = useMutation({
    mutationFn: (canEdit: boolean) => mealPlanShareService.generateInvite(planId!, canEdit),
    onSuccess: invalidate,
  });

  const revokeInvite = useMutation({
    mutationFn: () => mealPlanShareService.revokeInvite(planId!),
    onSuccess: invalidate,
  });

  const updatePermission = useMutation({
    mutationFn: (canEdit: boolean) => mealPlanShareService.updatePermission(planId!, canEdit),
    onSuccess: invalidate,
  });

  const removeSharedUser = useMutation({
    mutationFn: () => mealPlanShareService.removeSharedUser(planId!),
    onSuccess: invalidate,
  });

  const leaveShare = useMutation({
    mutationFn: () => mealPlanShareService.leaveShare(planId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.all });
    },
  });

  return {
    generateInvite: generateInvite.mutateAsync,
    revokeInvite: revokeInvite.mutateAsync,
    updatePermission: updatePermission.mutateAsync,
    removeSharedUser: removeSharedUser.mutateAsync,
    leaveShare: leaveShare.mutateAsync,
    isGenerating: generateInvite.isPending,
  };
}
