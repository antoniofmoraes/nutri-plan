import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mcpService, type McpAccessMode } from '@/services/mcpService';
import { useAuth } from '@/contexts/AuthContext';

export const mcpKeys = {
  all: ['mcp'] as const,
  mealPlanAccess: () => [...mcpKeys.all, 'meal-plan-access'] as const,
};

export function useMcpIntegrations() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const accessQuery = useQuery({
    queryKey: mcpKeys.mealPlanAccess(),
    queryFn: () => mcpService.getMealPlanAccess(),
    enabled: isAuthenticated,
  });

  const updateAccess = useMutation({
    mutationFn: ({ planId, mode }: { planId: string; mode: McpAccessMode }) =>
      mcpService.setMealPlanAccess(planId, mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mcpKeys.mealPlanAccess() });
    },
  });

  return {
    mealPlanAccess: accessQuery.data ?? [],
    isLoading: accessQuery.isLoading,
    setMealPlanAccess: updateAccess.mutateAsync,
    pendingPlanId: updateAccess.variables?.planId,
    isUpdating: updateAccess.isPending,
  };
}
