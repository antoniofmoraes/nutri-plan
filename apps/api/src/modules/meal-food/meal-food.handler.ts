import { Context } from 'hono';
import { mealFoodService } from './meal-food.service.js';
import { addFoodToMealSchema } from '../../dtos/meal-plan.dto.js';
import { Variables } from '../../types/index.js';
import { z } from 'zod';

const updateQuantitySchema = z.object({
  quantity: z.number().positive('Quantidade deve ser positivo'),
});

export class MealFoodHandler {
  async getMealFoods(c: Context<{ Variables: Variables }>) {
    const userId = c.get('userId');
    const mealId = c.req.param('mealId');
    const foods = await mealFoodService.getMealFoods(mealId, userId);
    
    return c.json({ success: true, data: foods });
  }

  async addFoodToMeal(c: Context<{ Variables: Variables }>) {
    const userId = c.get('userId');
    const mealId = c.req.param('mealId');
    const body = await c.req.json();
    const input = addFoodToMealSchema.parse(body);
    const mealFood = await mealFoodService.addFoodToMeal(mealId, userId, input);
    
    return c.json({ success: true, data: mealFood }, 201);
  }

  async updateFoodQuantity(c: Context<{ Variables: Variables }>) {
    const userId = c.get('userId');
    const mealId = c.req.param('mealId');
    const foodId = c.req.param('foodId');
    const body = await c.req.json();
    const { quantity } = updateQuantitySchema.parse(body);
    const mealFood = await mealFoodService.updateFoodQuantity(mealId, foodId, userId, quantity);
    
    return c.json({ success: true, data: mealFood });
  }

  async removeFoodFromMeal(c: Context<{ Variables: Variables }>) {
    const userId = c.get('userId');
    const mealId = c.req.param('mealId');
    const foodId = c.req.param('foodId');
    const result = await mealFoodService.removeFoodFromMeal(mealId, foodId, userId);
    
    return c.json({ success: true, ...result });
  }
}

export const mealFoodHandler = new MealFoodHandler();
