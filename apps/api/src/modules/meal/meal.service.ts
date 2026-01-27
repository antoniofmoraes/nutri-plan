import { mealRepository } from './meal.repository.js';
import { mealPlanRepository } from '../meal-plan/meal-plan.repository.js';
import { CreateMealInput, UpdateMealInput } from '../../dtos/meal-plan.dto.js';
import { WeekDay } from '../../types/index.js';

export class MealService {
  async getMealsForDay(planId: string, day: WeekDay, userId: string) {
    const plan = await mealPlanRepository.findById(planId);

    if (!plan) {
      const error = new Error('Plano alimentar não encontrado') as any;
      error.statusCode = 404;
      throw error;
    }

    if (plan.userId !== userId) {
      const error = new Error('Acesso negado') as any;
      error.statusCode = 403;
      throw error;
    }

    const dayPlan = await mealRepository.findDayPlan(planId, day);

    if (!dayPlan) {
      const error = new Error('Dia não encontrado') as any;
      error.statusCode = 404;
      throw error;
    }

    return dayPlan.meals;
  }

  async createMeal(planId: string, day: WeekDay, userId: string, input: CreateMealInput) {
    const plan = await mealPlanRepository.findById(planId);

    if (!plan) {
      const error = new Error('Plano alimentar não encontrado') as any;
      error.statusCode = 404;
      throw error;
    }

    if (plan.userId !== userId) {
      const error = new Error('Acesso negado') as any;
      error.statusCode = 403;
      throw error;
    }

    const dayPlan = await mealRepository.findDayPlan(planId, day);

    if (!dayPlan) {
      const error = new Error('Dia não encontrado') as any;
      error.statusCode = 404;
      throw error;
    }

    return mealRepository.create(dayPlan.id, input);
  }

  async updateMeal(mealId: string, userId: string, input: UpdateMealInput) {
    const meal = await mealRepository.findMealById(mealId);

    if (!meal) {
      const error = new Error('Refeição não encontrada') as any;
      error.statusCode = 404;
      throw error;
    }

    if (meal.dayPlan.mealPlan.userId !== userId) {
      const error = new Error('Acesso negado') as any;
      error.statusCode = 403;
      throw error;
    }

    return mealRepository.update(mealId, input);
  }

  async deleteMeal(mealId: string, userId: string) {
    const meal = await mealRepository.findMealById(mealId);

    if (!meal) {
      const error = new Error('Refeição não encontrada') as any;
      error.statusCode = 404;
      throw error;
    }

    if (meal.dayPlan.mealPlan.userId !== userId) {
      const error = new Error('Acesso negado') as any;
      error.statusCode = 403;
      throw error;
    }

    await mealRepository.delete(mealId);
    return { message: 'Refeição excluída com sucesso' };
  }
}

export const mealService = new MealService();
