/// Chaves de query centralizadas aqui, e não nos hooks, porque `useUndo` precisa delas
/// para invalidar por domínio — e importá-las dos hooks criava ciclo de import.
export const foodKeys = {
  all: ['foods'] as const,
  list: (params?: Record<string, unknown>) => [...foodKeys.all, 'list', params] as const,
};

export const mealPlanKeys = {
  all: ['meal-plans'] as const,
  lists: () => [...mealPlanKeys.all, 'list'] as const,
  detail: (id: string) => [...mealPlanKeys.all, 'detail', id] as const,
};

export const presetMealKeys = {
  all: ['preset-meals'] as const,
  lists: () => [...presetMealKeys.all, 'list'] as const,
};
