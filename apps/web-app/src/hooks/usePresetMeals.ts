import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { presetMealService } from '@/services/presetMealService';
import { useAuth } from '@/contexts/AuthContext';
import { mealPlanKeys } from './useMealPlans';
import type { Food } from '@/types';

export const presetMealKeys = {
  all: ['preset-meals'] as const,
  lists: () => [...presetMealKeys.all, 'list'] as const,
};

export function usePresetMeals() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: presetMealKeys.lists(),
    queryFn: () => presetMealService.getAll(),
    enabled: isAuthenticated,
  });

  const invalidatePresets = () =>
    queryClient.invalidateQueries({ queryKey: presetMealKeys.all });

  const create = useMutation({
    mutationFn: (name: string) => presetMealService.create(name),
    onSuccess: invalidatePresets,
  });

  const update = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      presetMealService.update(id, name),
    onSuccess: invalidatePresets,
  });

  const duplicate = useMutation({
    mutationFn: (id: string) => presetMealService.duplicate(id),
    onSuccess: invalidatePresets,
  });

  const remove = useMutation({
    mutationFn: (id: string) => presetMealService.delete(id),
    onSuccess: invalidatePresets,
  });

  const addFood = useMutation({
    mutationFn: ({ presetId, foodId, quantity }: { presetId: string; foodId: string; quantity: number }) =>
      presetMealService.addFood(presetId, foodId, quantity),
    onSuccess: invalidatePresets,
  });

  const updateFood = useMutation({
    mutationFn: ({ presetId, foodId, updates }: { presetId: string; foodId: string; updates: { newFoodId?: string; quantity?: number } }) =>
      presetMealService.updateFood(presetId, foodId, updates),
    onSuccess: invalidatePresets,
  });

  const removeFood = useMutation({
    mutationFn: ({ presetId, foodId }: { presetId: string; foodId: string }) =>
      presetMealService.removeFood(presetId, foodId),
    onSuccess: invalidatePresets,
  });

  const apply = useMutation({
    mutationFn: ({ presetId, targetMealIds }: { presetId: string; targetMealIds: string[] }) =>
      presetMealService.apply(presetId, targetMealIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mealPlanKeys.all });
    },
  });

  return {
    presetMeals: query.data ?? [],
    isLoading: query.isLoading,
    addPresetMeal: create.mutateAsync,
    updatePresetMeal: (id: string, name: string) =>
      update.mutateAsync({ id, name }),
    duplicatePresetMeal: duplicate.mutateAsync,
    deletePresetMeal: remove.mutateAsync,
    addFoodToPreset: (presetId: string, food: Food, quantity: number) =>
      addFood.mutateAsync({ presetId, foodId: food.id, quantity }),
    updateFoodInPreset: (presetId: string, foodId: string, updates: { newFoodId?: string; quantity?: number }) =>
      updateFood.mutateAsync({ presetId, foodId, updates }),
    removeFoodFromPreset: (presetId: string, foodId: string) =>
      removeFood.mutateAsync({ presetId, foodId }),
    applyPreset: (presetId: string, targetMealIds: string[]) =>
      apply.mutateAsync({ presetId, targetMealIds }),
  };
}
