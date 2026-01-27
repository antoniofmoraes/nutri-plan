import { Context } from 'hono';
import { mealService } from './meal.service.js';
import { createMealSchema, updateMealSchema, dayParamSchema } from '../../dtos/meal-plan.dto.js';
import { Variables, WeekDay } from '../../types/index.js';

export class MealHandler {
  async getMealsForDay(c: Context<{ Variables: Variables }>) {
    const userId = c.get('userId');
    const planId = c.req.param('planId');
    const day = c.req.param('day') as WeekDay;
    
    dayParamSchema.parse({ day });
    
    const meals = await mealService.getMealsForDay(planId, day, userId);
    
    return c.json({ success: true, data: meals });
  }

  async createMeal(c: Context<{ Variables: Variables }>) {
    const userId = c.get('userId');
    const planId = c.req.param('planId');
    const day = c.req.param('day') as WeekDay;
    
    dayParamSchema.parse({ day });
    
    const body = await c.req.json();
    const input = createMealSchema.parse(body);
    const meal = await mealService.createMeal(planId, day, userId, input);
    
    return c.json({ success: true, data: meal }, 201);
  }

  async updateMeal(c: Context<{ Variables: Variables }>) {
    const userId = c.get('userId');
    const mealId = c.req.param('mealId');
    const body = await c.req.json();
    const input = updateMealSchema.parse(body);
    const meal = await mealService.updateMeal(mealId, userId, input);
    
    return c.json({ success: true, data: meal });
  }

  async deleteMeal(c: Context<{ Variables: Variables }>) {
    const userId = c.get('userId');
    const mealId = c.req.param('mealId');
    const result = await mealService.deleteMeal(mealId, userId);
    
    return c.json({ success: true, ...result });
  }
}

export const mealHandler = new MealHandler();
