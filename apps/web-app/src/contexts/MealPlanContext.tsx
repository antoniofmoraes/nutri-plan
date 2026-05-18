import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { MealPlan, Food, Meal, WeekDay, DayPlan, MacroSummary, PresetMeal } from '@/types';
import { mealPlanService } from '@/services/mealPlanService';
import { foodService } from '@/services/foodService';
import { presetMealService } from '@/services/presetMealService';
import { useAuth } from './AuthContext';

interface PlanInput {
  name: string;
  goal: 'emagrecer' | 'manter' | 'ganhar';
  dailyCalories: number;
  dailyProtein?: number | null;
  dailyCarbs?: number | null;
  dailyFat?: number | null;
}

interface PlanUpdate {
  name?: string;
  goal?: 'emagrecer' | 'manter' | 'ganhar';
  dailyCalories?: number;
  dailyProtein?: number | null;
  dailyCarbs?: number | null;
  dailyFat?: number | null;
}

interface SlotInput {
  name: string;
  time?: string;
}

interface SlotUpdate {
  name?: string;
  time?: string;
}

interface MealPlanContextType {
  mealPlans: MealPlan[];
  foods: Food[];
  presetMeals: PresetMeal[];
  activePlanId: string | null;
  isLoading: boolean;
  error: string | null;
  setActivePlanId: (id: string | null) => void;
  refreshData: () => Promise<void>;
  refreshPlan: (planId: string) => Promise<void>;
  addMealPlan: (plan: PlanInput) => Promise<void>;
  updateMealPlan: (id: string, updates: PlanUpdate) => Promise<void>;
  deleteMealPlan: (id: string) => Promise<void>;
  addFood: (food: Omit<Food, 'id'>) => Promise<void>;
  updateFood: (id: string, updates: Partial<Food>) => Promise<void>;
  deleteFood: (id: string) => Promise<void>;
  addSlot: (planId: string, input: SlotInput) => Promise<void>;
  updateSlot: (planId: string, slotId: string, updates: SlotUpdate) => Promise<void>;
  deleteSlot: (planId: string, slotId: string) => Promise<void>;
  reorderSlots: (planId: string, slotIds: string[]) => Promise<void>;
  addFoodToMeal: (planId: string, mealId: string, food: Food, quantity: number) => Promise<void>;
  removeFoodFromMeal: (planId: string, mealId: string, foodId: string) => Promise<void>;
  updateMealFood: (planId: string, mealId: string, foodId: string, updates: { newFoodId?: string; quantity?: number }) => Promise<void>;
  setMealCheat: (planId: string, mealId: string, isCheat: boolean) => Promise<void>;
  copyMeal: (planId: string, sourceMealId: string, targetMealIds: string[]) => Promise<void>;
  addPresetMeal: (name: string) => Promise<void>;
  updatePresetMeal: (id: string, name: string) => Promise<void>;
  deletePresetMeal: (id: string) => Promise<void>;
  addFoodToPreset: (presetId: string, food: Food, quantity: number) => Promise<void>;
  updatePresetFood: (presetId: string, foodId: string, updates: { newFoodId?: string; quantity?: number }) => Promise<void>;
  removeFoodFromPreset: (presetId: string, foodId: string) => Promise<void>;
  applyPreset: (planId: string, presetId: string, targetMealIds: string[]) => Promise<void>;
  calculateMealMacros: (meal: Meal, plan?: MealPlan) => MacroSummary;
  calculateRawMealMacros: (meal: Meal) => MacroSummary;
  calculateDayMacros: (dayPlan: DayPlan, plan?: MealPlan) => MacroSummary;
  calculatePlanMacros: (plan: MealPlan) => MacroSummary;
  setMainPlan: (planId: string | null) => Promise<void>;
}

const MealPlanContext = createContext<MealPlanContextType | undefined>(undefined);

export function MealPlanProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [presetMeals, setPresetMeals] = useState<PresetMeal[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);
    try {
      const [plansData, foodsPage, presetsData] = await Promise.all([
        mealPlanService.getAll(),
        foodService.getAll({ pageSize: 10000 }),
        presetMealService.getAll(),
      ]);
      setMealPlans(plansData);
      setFoods(foodsPage.items);
      setPresetMeals(presetsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const refreshPlan = useCallback(async (planId: string) => {
    try {
      const plan = await mealPlanService.getById(planId);
      setMealPlans(prev => prev.map(p => p.id === planId ? plan : p));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar plano');
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    } else {
      setMealPlans([]);
      setFoods([]);
      setPresetMeals([]);
    }
  }, [isAuthenticated, refreshData]);

  const addMealPlan = async (plan: PlanInput) => {
    const newPlan = await mealPlanService.create(plan);
    setMealPlans(prev => [...prev, newPlan]);
  };

  const updateMealPlan = async (id: string, updates: PlanUpdate) => {
    const updated = await mealPlanService.update(id, updates);
    setMealPlans(prev => prev.map(p => p.id === id ? updated : p));
  };

  const deleteMealPlan = async (id: string) => {
    await mealPlanService.delete(id);
    setMealPlans(prev => prev.filter(p => p.id !== id));
  };

  const setMainPlan = async (planId: string | null) => {
    await mealPlanService.setMainPlan(planId);
    setMealPlans(prev => prev.map(p => ({ ...p, isMain: p.id === planId })));
  };

  const addFood = async (food: Omit<Food, 'id'>) => {
    const newFood = await foodService.create(food);
    setFoods(prev => [...prev, newFood]);
  };

  const updateFood = async (id: string, updates: Partial<Food>) => {
    const updated = await foodService.update(id, updates);
    setFoods(prev => prev.map(f => f.id === id ? updated : f));
  };

  const deleteFood = async (id: string) => {
    await foodService.delete(id);
    setFoods(prev => prev.filter(f => f.id !== id));
  };

  const addSlot = async (planId: string, input: SlotInput) => {
    await mealPlanService.addSlot(planId, input);
    await refreshPlan(planId);
  };

  const updateSlot = async (planId: string, slotId: string, updates: SlotUpdate) => {
    await mealPlanService.updateSlot(planId, slotId, updates);
    await refreshPlan(planId);
  };

  const deleteSlot = async (planId: string, slotId: string) => {
    await mealPlanService.deleteSlot(planId, slotId);
    await refreshPlan(planId);
  };

  const reorderSlots = async (planId: string, slotIds: string[]) => {
    await mealPlanService.reorderSlots(planId, slotIds);
    await refreshPlan(planId);
  };

  const addFoodToMeal = async (planId: string, mealId: string, food: Food, quantity: number) => {
    await mealPlanService.addFoodToMeal(mealId, { foodId: food.id, quantity });
    await refreshPlan(planId);
  };

  const removeFoodFromMeal = async (planId: string, mealId: string, foodId: string) => {
    await mealPlanService.removeFoodFromMeal(mealId, foodId);
    await refreshPlan(planId);
  };

  const updateMealFood = async (planId: string, mealId: string, foodId: string, updates: { newFoodId?: string; quantity?: number }) => {
    await mealPlanService.updateMealFood(mealId, foodId, updates);
    await refreshPlan(planId);
  };

  const setMealCheat = async (planId: string, mealId: string, isCheat: boolean) => {
    await mealPlanService.setMealCheat(mealId, isCheat);
    await refreshPlan(planId);
  };

  const copyMeal = async (planId: string, sourceMealId: string, targetMealIds: string[]) => {
    await mealPlanService.copyMeal(sourceMealId, targetMealIds);
    await refreshPlan(planId);
  };

  const refreshPresets = async () => {
    const data = await presetMealService.getAll();
    setPresetMeals(data);
  };

  const addPresetMeal = async (name: string) => {
    const created = await presetMealService.create(name);
    setPresetMeals(prev => [...prev, created]);
  };

  const updatePresetMeal = async (id: string, name: string) => {
    const updated = await presetMealService.update(id, name);
    setPresetMeals(prev => prev.map(p => p.id === id ? updated : p));
  };

  const deletePresetMeal = async (id: string) => {
    await presetMealService.delete(id);
    setPresetMeals(prev => prev.filter(p => p.id !== id));
  };

  const addFoodToPreset = async (presetId: string, food: Food, quantity: number) => {
    await presetMealService.addFood(presetId, food.id, quantity);
    await refreshPresets();
  };

  const updatePresetFood = async (presetId: string, foodId: string, updates: { newFoodId?: string; quantity?: number }) => {
    await presetMealService.updateFood(presetId, foodId, updates);
    await refreshPresets();
  };

  const removeFoodFromPreset = async (presetId: string, foodId: string) => {
    await presetMealService.removeFood(presetId, foodId);
    await refreshPresets();
  };

  const applyPreset = async (planId: string, presetId: string, targetMealIds: string[]) => {
    await presetMealService.apply(presetId, targetMealIds);
    await refreshPlan(planId);
  };

  // Raw macros — what this meal's foods actually total
  const calculateRawMealMacros = (meal: Meal): MacroSummary => {
    return meal.foods.reduce(
      (acc, { food, quantity }) => ({
        calories: acc.calories + (food.calories * quantity) / 100,
        protein: acc.protein + (food.protein * quantity) / 100,
        carbs: acc.carbs + (food.carbs * quantity) / 100,
        fat: acc.fat + (food.fat * quantity) / 100,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  // Slot averages: for each slot, the average of non-free meals' macros
  const buildSlotAverages = (plan: MealPlan): Map<string, MacroSummary> => {
    const grouped = new Map<string, { sum: MacroSummary; count: number }>();
    for (const day of plan.days) {
      for (const meal of day.meals) {
        if (meal.isCheat) continue;
        const macros = calculateRawMealMacros(meal);
        const entry = grouped.get(meal.slotId) ?? { sum: { calories: 0, protein: 0, carbs: 0, fat: 0 }, count: 0 };
        entry.sum.calories += macros.calories;
        entry.sum.protein += macros.protein;
        entry.sum.carbs += macros.carbs;
        entry.sum.fat += macros.fat;
        entry.count += 1;
        grouped.set(meal.slotId, entry);
      }
    }
    const averages = new Map<string, MacroSummary>();
    for (const [slotId, { sum, count }] of grouped) {
      averages.set(slotId, {
        calories: count > 0 ? sum.calories / count : 0,
        protein: count > 0 ? sum.protein / count : 0,
        carbs: count > 0 ? sum.carbs / count : 0,
        fat: count > 0 ? sum.fat / count : 0,
      });
    }
    return averages;
  };

  // Effective macros: substitutes slot average for free meals (when plan provided)
  const calculateMealMacros = (meal: Meal, plan?: MealPlan): MacroSummary => {
    if (meal.isCheat && plan) {
      const averages = buildSlotAverages(plan);
      return averages.get(meal.slotId) ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    return calculateRawMealMacros(meal);
  };

  // Day total: sums each meal, substituting free meals with slot averages
  const calculateDayMacros = (dayPlan: DayPlan, plan?: MealPlan): MacroSummary => {
    const averages = plan ? buildSlotAverages(plan) : null;
    return dayPlan.meals.reduce(
      (acc, meal) => {
        const mealMacros = meal.isCheat && averages
          ? averages.get(meal.slotId) ?? { calories: 0, protein: 0, carbs: 0, fat: 0 }
          : calculateRawMealMacros(meal);
        return {
          calories: acc.calories + mealMacros.calories,
          protein: acc.protein + mealMacros.protein,
          carbs: acc.carbs + mealMacros.carbs,
          fat: acc.fat + mealMacros.fat,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  // Plan-level daily average: excludes free meals entirely
  const calculatePlanMacros = (plan: MealPlan): MacroSummary => {
    const total = plan.days.reduce(
      (acc, day) => {
        for (const meal of day.meals) {
          if (meal.isCheat) continue;
          const macros = calculateRawMealMacros(meal);
          acc.calories += macros.calories;
          acc.protein += macros.protein;
          acc.carbs += macros.carbs;
          acc.fat += macros.fat;
        }
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    return {
      calories: total.calories / 7,
      protein: total.protein / 7,
      carbs: total.carbs / 7,
      fat: total.fat / 7,
    };
  };

  return (
    <MealPlanContext.Provider
      value={{
        mealPlans,
        foods,
        presetMeals,
        activePlanId,
        isLoading,
        error,
        setActivePlanId,
        refreshData,
        refreshPlan,
        addMealPlan,
        updateMealPlan,
        deleteMealPlan,
        setMainPlan,
        addFood,
        updateFood,
        deleteFood,
        addSlot,
        updateSlot,
        deleteSlot,
        reorderSlots,
        addFoodToMeal,
        removeFoodFromMeal,
        updateMealFood,
        setMealCheat,
        copyMeal,
        addPresetMeal,
        updatePresetMeal,
        deletePresetMeal,
        addFoodToPreset,
        updatePresetFood,
        removeFoodFromPreset,
        applyPreset,
        calculateMealMacros,
        calculateRawMealMacros,
        calculateDayMacros,
        calculatePlanMacros,
      }}
    >
      {children}
    </MealPlanContext.Provider>
  );
}

export function useMealPlan() {
  const context = useContext(MealPlanContext);
  if (!context) {
    throw new Error('useMealPlan must be used within a MealPlanProvider');
  }
  return context;
}
