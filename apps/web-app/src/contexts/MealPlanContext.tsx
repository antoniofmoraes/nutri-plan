import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { MealPlan, Food, Meal, WeekDay, DayPlan, MacroSummary } from '@/types';
import { mealPlanService } from '@/services/mealPlanService';
import { foodService } from '@/services/foodService';
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
  addFoodToMeal: (planId: string, mealId: string, food: Food, quantity: number) => Promise<void>;
  removeFoodFromMeal: (planId: string, mealId: string, foodId: string) => Promise<void>;
  calculateMealMacros: (meal: Meal) => MacroSummary;
  calculateDayMacros: (dayPlan: DayPlan) => MacroSummary;
  calculatePlanMacros: (plan: MealPlan) => MacroSummary;
}

const MealPlanContext = createContext<MealPlanContextType | undefined>(undefined);

export function MealPlanProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);
    try {
      const [plansData, foodsPage] = await Promise.all([
        mealPlanService.getAll(),
        foodService.getAll({ pageSize: 10000 }),
      ]);
      setMealPlans(plansData);
      setFoods(foodsPage.items);
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

  const addFoodToMeal = async (planId: string, mealId: string, food: Food, quantity: number) => {
    await mealPlanService.addFoodToMeal(mealId, { foodId: food.id, quantity });
    await refreshPlan(planId);
  };

  const removeFoodFromMeal = async (planId: string, mealId: string, foodId: string) => {
    await mealPlanService.removeFoodFromMeal(mealId, foodId);
    await refreshPlan(planId);
  };

  const calculateMealMacros = (meal: Meal): MacroSummary => {
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

  const calculateDayMacros = (dayPlan: DayPlan): MacroSummary => {
    return dayPlan.meals.reduce(
      (acc, meal) => {
        const mealMacros = calculateMealMacros(meal);
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

  const calculatePlanMacros = (plan: MealPlan): MacroSummary => {
    const total = plan.days.reduce(
      (acc, day) => {
        const dayMacros = calculateDayMacros(day);
        return {
          calories: acc.calories + dayMacros.calories,
          protein: acc.protein + dayMacros.protein,
          carbs: acc.carbs + dayMacros.carbs,
          fat: acc.fat + dayMacros.fat,
        };
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
        activePlanId,
        isLoading,
        error,
        setActivePlanId,
        refreshData,
        refreshPlan,
        addMealPlan,
        updateMealPlan,
        deleteMealPlan,
        addFood,
        updateFood,
        deleteFood,
        addSlot,
        updateSlot,
        deleteSlot,
        addFoodToMeal,
        removeFoodFromMeal,
        calculateMealMacros,
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
