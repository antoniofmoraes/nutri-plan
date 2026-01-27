import { Hono } from 'hono';
import { mealHandler } from './meal.handler.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { Variables } from '../../types/index.js';

const mealRoutes = new Hono<{ Variables: Variables }>();

// All routes are protected
mealRoutes.use('*', authMiddleware);

// Nested under meal-plans
// GET /meal-plans/:planId/days/:day/meals
mealRoutes.get('/:planId/days/:day/meals', (c) => mealHandler.getMealsForDay(c));

// POST /meal-plans/:planId/days/:day/meals
mealRoutes.post('/:planId/days/:day/meals', (c) => mealHandler.createMeal(c));

// PATCH /meal-plans/:planId/days/:day/meals/:mealId
mealRoutes.patch('/:planId/days/:day/meals/:mealId', (c) => mealHandler.updateMeal(c));

// DELETE /meal-plans/:planId/days/:day/meals/:mealId
mealRoutes.delete('/:planId/days/:day/meals/:mealId', (c) => mealHandler.deleteMeal(c));

export { mealRoutes };
