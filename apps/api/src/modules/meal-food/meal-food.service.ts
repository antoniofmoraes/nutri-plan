import { mealFoodRepository } from './meal-food.repository.js';
import { AddFoodToMealInput } from '../../dtos/meal-plan.dto.js';

export class MealFoodService {
  async addFoodToMeal(mealId: string, userId: string, input: AddFoodToMealInput) {
    const meal = await mealFoodRepository.findMealById(mealId);

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

    const food = await mealFoodRepository.findFoodById(input.foodId);

    if (!food) {
      const error = new Error('Alimento não encontrado') as any;
      error.statusCode = 404;
      throw error;
    }

    // Check if food is already in meal
    const existingMealFood = await mealFoodRepository.findMealFood(mealId, input.foodId);

    if (existingMealFood) {
      // Update quantity instead of creating duplicate
      return mealFoodRepository.updateQuantity(mealId, input.foodId, input.quantity);
    }

    return mealFoodRepository.addFoodToMeal(mealId, input.foodId, input.quantity);
  }

  async updateFoodQuantity(mealId: string, foodId: string, userId: string, quantity: number) {
    const meal = await mealFoodRepository.findMealById(mealId);

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

    const mealFood = await mealFoodRepository.findMealFood(mealId, foodId);

    if (!mealFood) {
      const error = new Error('Alimento não está na refeição') as any;
      error.statusCode = 404;
      throw error;
    }

    return mealFoodRepository.updateQuantity(mealId, foodId, quantity);
  }

  async removeFoodFromMeal(mealId: string, foodId: string, userId: string) {
    const meal = await mealFoodRepository.findMealById(mealId);

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

    const mealFood = await mealFoodRepository.findMealFood(mealId, foodId);

    if (!mealFood) {
      const error = new Error('Alimento não está na refeição') as any;
      error.statusCode = 404;
      throw error;
    }

    await mealFoodRepository.removeFoodFromMeal(mealId, foodId);
    return { message: 'Alimento removido da refeição' };
  }

  async getMealFoods(mealId: string, userId: string) {
    const meal = await mealFoodRepository.findMealById(mealId);

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

    const mealWithFoods = await mealFoodRepository.getMealWithFoods(mealId);
    return mealWithFoods?.foods || [];
  }
}

export const mealFoodService = new MealFoodService();
