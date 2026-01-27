import { Context } from 'hono';
import { foodService } from './food.service.js';
import { createFoodSchema, updateFoodSchema } from '../../dtos/food.dto.js';

export class FoodHandler {
  async getAllFoods(c: Context) {
    const search = c.req.query('search');
    const foods = await foodService.getAllFoods(search);
    
    return c.json({ success: true, data: foods });
  }

  async getFoodById(c: Context) {
    const id = c.req.param('id');
    const food = await foodService.getFoodById(id);
    
    return c.json({ success: true, data: food });
  }

  async createFood(c: Context) {
    const body = await c.req.json();
    const input = createFoodSchema.parse(body);
    const food = await foodService.createFood(input);
    
    return c.json({ success: true, data: food }, 201);
  }

  async updateFood(c: Context) {
    const id = c.req.param('id');
    const body = await c.req.json();
    const input = updateFoodSchema.parse(body);
    const food = await foodService.updateFood(id, input);
    
    return c.json({ success: true, data: food });
  }

  async deleteFood(c: Context) {
    const id = c.req.param('id');
    const result = await foodService.deleteFood(id);
    
    return c.json({ success: true, ...result });
  }
}

export const foodHandler = new FoodHandler();
