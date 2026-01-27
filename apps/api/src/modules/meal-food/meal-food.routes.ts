import { Hono } from 'hono';
import { mealFoodHandler } from './meal-food.handler.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { Variables } from '../../types/index.js';

const mealFoodRoutes = new Hono<{ Variables: Variables }>();

// All routes are protected
mealFoodRoutes.use('*', authMiddleware);

// GET /meals/:mealId/foods
mealFoodRoutes.get('/:mealId/foods', (c) => mealFoodHandler.getMealFoods(c));

// POST /meals/:mealId/foods
mealFoodRoutes.post('/:mealId/foods', (c) => mealFoodHandler.addFoodToMeal(c));

// PATCH /meals/:mealId/foods/:foodId
mealFoodRoutes.patch('/:mealId/foods/:foodId', (c) => mealFoodHandler.updateFoodQuantity(c));

// DELETE /meals/:mealId/foods/:foodId
mealFoodRoutes.delete('/:mealId/foods/:foodId', (c) => mealFoodHandler.removeFoodFromMeal(c));

export { mealFoodRoutes };
