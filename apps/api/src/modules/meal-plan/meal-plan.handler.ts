import { Context } from 'hono';
import { mealPlanService } from './meal-plan.service.js';
import { createMealPlanSchema, updateMealPlanSchema } from '../../dtos/meal-plan.dto.js';
import { Variables } from '../../types/index.js';

export class MealPlanHandler {
  async getAll(c: Context<{ Variables: Variables }>) {
    const userId = c.get('userId');
    const plans = await mealPlanService.getAllByUser(userId);
    
    return c.json({ success: true, data: plans });
  }

  async getById(c: Context<{ Variables: Variables }>) {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const plan = await mealPlanService.getById(id, userId);
    
    return c.json({ success: true, data: plan });
  }

  async create(c: Context<{ Variables: Variables }>) {
    const userId = c.get('userId');
    const body = await c.req.json();
    const input = createMealPlanSchema.parse(body);
    const plan = await mealPlanService.create(userId, input);
    
    return c.json({ success: true, data: plan }, 201);
  }

  async update(c: Context<{ Variables: Variables }>) {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const body = await c.req.json();
    const input = updateMealPlanSchema.parse(body);
    const plan = await mealPlanService.update(id, userId, input);
    
    return c.json({ success: true, data: plan });
  }

  async delete(c: Context<{ Variables: Variables }>) {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const result = await mealPlanService.delete(id, userId);
    
    return c.json({ success: true, ...result });
  }
}

export const mealPlanHandler = new MealPlanHandler();
