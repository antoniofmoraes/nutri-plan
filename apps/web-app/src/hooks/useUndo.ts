import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toastUndo } from '@/lib/undo';
import { foodKeys, mealPlanKeys, presetMealKeys } from '@/lib/queryKeys';

const domainKeys: Record<string, readonly unknown[]> = {
  foods: foodKeys.all,
  'meal-plans': mealPlanKeys.all,
  'preset-meals': presetMealKeys.all,
};

/// Emite o toast de sucesso da mutação e, quando ela é reversível, a ação `Desfazer`.
/// Desfazer invalida os domínios que o servidor declarou ter tocado; em falha invalida
/// tudo, para a tela voltar a refletir o servidor em vez de um estado inventado.
export function useUndoToast() {
  const queryClient = useQueryClient();

  return useCallback(
    (message: string, undoToken?: string) => {
      toastUndo(message, undoToken, (domains) => {
        const keys = domains.length
          ? domains.map((d) => domainKeys[d]).filter(Boolean)
          : Object.values(domainKeys);

        for (const queryKey of keys) {
          queryClient.invalidateQueries({ queryKey });
        }
      });
    },
    [queryClient]
  );
}
