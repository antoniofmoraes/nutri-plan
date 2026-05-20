import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { foodService } from '@/services/foodService';
import { useAuth } from '@/contexts/AuthContext';
import type { Food } from '@/types';

export const foodKeys = {
  all: ['foods'] as const,
  list: (params?: Record<string, unknown>) => [...foodKeys.all, 'list', params] as const,
};

export function useAllFoods() {
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: foodKeys.list({ pageSize: 10000 }),
    queryFn: () => foodService.getAll({ pageSize: 10000 }).then(r => r.items),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  return {
    foods: query.data ?? [],
    isLoading: query.isLoading,
  };
}

export function useFoodMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (input: Omit<Food, 'id'>) => foodService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: foodKeys.all }),
  });

  const update = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Food> }) =>
      foodService.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: foodKeys.all }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => foodService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: foodKeys.all }),
  });

  return {
    createFood: create.mutateAsync,
    updateFood: (id: string, updates: Partial<Food>) =>
      update.mutateAsync({ id, updates }),
    deleteFood: remove.mutateAsync,
  };
}
