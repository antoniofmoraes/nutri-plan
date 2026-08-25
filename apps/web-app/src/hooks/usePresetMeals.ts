import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { presetMealService } from '@/services/presetMealService';
import { useAuth } from '@/contexts/AuthContext';
import { mealPlanKeys } from './useMealPlans';
import { useUndoToast } from './useUndo';
import type { Food } from '@/types';
import type { WithUndo } from '@/lib/api';

export const presetMealKeys = {
  all: ['preset-meals'] as const,
  lists: () => [...presetMealKeys.all, 'list'] as const,
};

export function usePresetMeals() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const undoToast = useUndoToast();

  const query = useQuery({
    queryKey: presetMealKeys.lists(),
    queryFn: () => presetMealService.getAll(),
    enabled: isAuthenticated,
  });

  const invalidatePresets = () =>
    queryClient.invalidateQueries({ queryKey: presetMealKeys.all });

  // Toda mutação da matriz confirma o que aconteceu e oferece Desfazer (CHG-002).
  const announce = (message: string) => (result: WithUndo<unknown>) => {
    invalidatePresets();
    undoToast(message, result.undoToken);
  };

  const create = useMutation({
    mutationFn: (name: string) => presetMealService.create(name),
    onSuccess: announce('Refeição pronta criada'),
  });

  const update = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      presetMealService.update(id, name),
    onSuccess: announce('Nome atualizado'),
  });

  const duplicate = useMutation({
    mutationFn: (id: string) => presetMealService.duplicate(id),
    onSuccess: announce('Refeição pronta duplicada'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => presetMealService.delete(id),
    onSuccess: announce('Refeição pronta excluída'),
  });

  const addFood = useMutation({
    mutationFn: ({ presetId, foodId, quantity }: { presetId: string; foodId: string; quantity: number }) =>
      presetMealService.addFood(presetId, foodId, quantity),
    onSuccess: announce('Alimento adicionado'),
  });

  const updateFood = useMutation({
    mutationFn: ({ presetId, foodId, updates }: { presetId: string; foodId: string; updates: { newFoodId?: string; quantity?: number } }) =>
      presetMealService.updateFood(presetId, foodId, updates),
    onSuccess: announce('Alimento atualizado'),
  });

  const removeFood = useMutation({
    mutationFn: ({ presetId, foodId }: { presetId: string; foodId: string }) =>
      presetMealService.removeFood(presetId, foodId),
    onSuccess: announce('Alimento removido'),
  });

  const copyFoodsFrom = useMutation({
    mutationFn: ({ targetId, sourceId }: { targetId: string; sourceId: string }) =>
      presetMealService.copyFoodsFrom(targetId, sourceId),
    onSuccess: announce('Alimentos copiados'),
  });

  const apply = useMutation({
    mutationFn: ({ presetId, targetMealIds }: { presetId: string; targetMealIds: string[] }) =>
      presetMealService.apply(presetId, targetMealIds),
    onSuccess: (result, { targetMealIds }) => {
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.all });
      const count = targetMealIds.length;
      undoToast(
        `Aplicada em ${count} ${count === 1 ? 'refeição' : 'refeições'}`,
        result.undoToken
      );
    },
  });

  return {
    presetMeals: query.data ?? [],
    isLoading: query.isLoading,
    addPresetMeal: (name: string) => create.mutateAsync(name),
    updatePresetMeal: (id: string, name: string) =>
      update.mutateAsync({ id, name }),
    duplicatePresetMeal: (id: string) => duplicate.mutateAsync(id),
    deletePresetMeal: (id: string) => remove.mutateAsync(id),
    addFoodToPreset: (presetId: string, food: Food, quantity: number) =>
      addFood.mutateAsync({ presetId, foodId: food.id, quantity }),
    updateFoodInPreset: (presetId: string, foodId: string, updates: { newFoodId?: string; quantity?: number }) =>
      updateFood.mutateAsync({ presetId, foodId, updates }),
    removeFoodFromPreset: (presetId: string, foodId: string) =>
      removeFood.mutateAsync({ presetId, foodId }),
    copyFoodsBetweenPresets: (targetId: string, sourceId: string) =>
      copyFoodsFrom.mutateAsync({ targetId, sourceId }),
    applyPreset: (presetId: string, targetMealIds: string[]) =>
      apply.mutateAsync({ presetId, targetMealIds }),
  };
}
