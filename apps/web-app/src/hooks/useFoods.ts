import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { foodService } from '@/services/foodService';
import { useAuth } from '@/contexts/AuthContext';
import { useUndoToast } from './useUndo';
import type { Food } from '@/types';
import { foodKeys } from '@/lib/queryKeys';
import type { WithUndo } from '@/lib/api';

export { foodKeys } from '@/lib/queryKeys';

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
  const undoToast = useUndoToast();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: foodKeys.all });

  const announce = (message: string) => (result: WithUndo<unknown>) => {
    invalidate();
    undoToast(message, result.undoToken);
  };

  const create = useMutation({
    mutationFn: (input: Omit<Food, 'id'>) => foodService.create(input),
    onSuccess: announce('Alimento criado'),
  });

  const update = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Food> }) =>
      foodService.update(id, updates),
    onSuccess: announce('Alimento atualizado'),
  });

  // Sem undo: excluir do catálogo cascateia para dados de todos os usuários (CHG-002).
  const remove = useMutation({
    mutationFn: (id: string) => foodService.delete(id),
    onSuccess: () => {
      invalidate();
      toast.success('Alimento excluído');
    },
  });

  return {
    createFood: create.mutateAsync,
    updateFood: (id: string, updates: Partial<Food>) =>
      update.mutateAsync({ id, updates }),
    deleteFood: remove.mutateAsync,
  };
}
