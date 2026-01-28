import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { MealPlan, Food, Meal, WeekDay, DayPlan, MacroSummary } from '@/types';
import { mealPlanService } from '@/services/mealPlanService';
import { foodService } from '@/services/foodService';
import { useAuth } from './AuthContext';

interface MealPlanContextType {
  mealPlans: MealPlan[];
  foods: Food[];
  activePlanId: string | null;
  isLoading: boolean;
  error: string | null;
  setActivePlanId: (id: string | null) => void;
  refreshData: () => Promise<void>;
  addMealPlan: (plan: { name: string; goal: 'emagrecer' | 'manter' | 'ganhar'; dailyCalories: number; dailyProtein?: number | null; dailyCarbs?: number | null; dailyFat?: number | null }) => Promise<void>;
  updateMealPlan: (id: string, updates: { name?: string; goal?: 'emagrecer' | 'manter' | 'ganhar'; dailyCalories?: number; dailyProtein?: number | null; dailyCarbs?: number | null; dailyFat?: number | null }) => Promise<void>;
  deleteMealPlan: (id: string) => Promise<void>;
  addFood: (food: Omit<Food, 'id'>) => Promise<void>;
  updateFood: (id: string, updates: Partial<Food>) => Promise<void>;
  deleteFood: (id: string) => Promise<void>;
  addMealToDay: (planId: string, day: WeekDay, meal: { name: string; time?: string }) => Promise<void>;
  updateMeal: (planId: string, day: WeekDay, mealId: string, updates: { name?: string; time?: string }) => Promise<void>;
  deleteMeal: (planId: string, day: WeekDay, mealId: string) => Promise<void>;
  addFoodToMeal: (planId: string, day: WeekDay, mealId: string, food: Food, quantity: number) => Promise<void>;
  removeFoodFromMeal: (planId: string, day: WeekDay, mealId: string, foodId: string) => Promise<void>;
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
      const [plansData, foodsData] = await Promise.all([
        mealPlanService.getAll(),
        foodService.getAll(),
      ]);
      setMealPlans(plansData);
      setFoods(foodsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    } else {
      setMealPlans([]);
      setFoods([]);
    }
  }, [isAuthenticated, refreshData]);

  const addMealPlan = async (plan: { name: string; goal: 'emagrecer' | 'manter' | 'ganhar'; dailyCalories: number; dailyProtein?: number | null; dailyCarbs?: number | null; dailyFat?: number | null }) => {
    try {
      const newPlan = await mealPlanService.create(plan);
      setMealPlans(prev => [...prev, newPlan]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar plano');
      throw err;
    }
  };

  const updateMealPlan = async (id: string, updates: { name?: string; goal?: 'emagrecer' | 'manter' | 'ganhar'; dailyCalories?: number; dailyProtein?: number | null; dailyCarbs?: number | null; dailyFat?: number | null }) => {
    try {
      const updatedPlan = await mealPlanService.update(id, updates);
      setMealPlans(prev => prev.map(p => p.id === id ? updatedPlan : p));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar plano');
      throw err;
    }
  };

  const deleteMealPlan = async (id: string) => {
    try {
      await mealPlanService.delete(id);
      setMealPlans(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir plano');
      throw err;
    }
  };

  const addFood = async (food: Omit<Food, 'id'>) => {
    try {
      const newFood = await foodService.create(food);
      setFoods(prev => [...prev, newFood]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar alimento');
      throw err;
    }
  };

  const updateFood = async (id: string, updates: Partial<Food>) => {
    try {
      const updatedFood = await foodService.update(id, updates);
      setFoods(prev => prev.map(f => f.id === id ? updatedFood : f));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar alimento');
      throw err;
    }
  };

  const deleteFood = async (id: string) => {
    try {
      await foodService.delete(id);
      setFoods(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir alimento');
      throw err;
    }
  };

  const addMealToDay = async (planId: string, day: WeekDay, meal: { name: string; time?: string }) => {
    try {
      await mealPlanService.addMeal(planId, day, meal);
      await refreshData(); // Refresh to get updated plan structure
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar refeição');
      throw err;
    }
  };

  const updateMeal = async (planId: string, day: WeekDay, mealId: string, updates: { name?: string; time?: string }) => {
    try {
      await mealPlanService.updateMeal(planId, day, mealId, updates);
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar refeição');
      throw err;
    }
  };

  const deleteMeal = async (planId: string, day: WeekDay, mealId: string) => {
    try {
      await mealPlanService.deleteMeal(planId, day, mealId);
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir refeição');
      throw err;
    }
  };

  const addFoodToMeal = async (_planId: string, _day: WeekDay, mealId: string, food: Food, quantity: number) => {
    try {
      await mealPlanService.addFoodToMeal(mealId, { foodId: food.id, quantity });
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar alimento');
      throw err;
    }
  };

  const removeFoodFromMeal = async (_planId: string, _day: WeekDay, mealId: string, foodId: string) => {
    try {
      await mealPlanService.removeFoodFromMeal(mealId, foodId);
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover alimento');
      throw err;
    }
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
    // Return daily average
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
        addMealPlan,
        updateMealPlan,
        deleteMealPlan,
        addFood,
        updateFood,
        deleteFood,
        addMealToDay,
        updateMeal,
        deleteMeal,
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
