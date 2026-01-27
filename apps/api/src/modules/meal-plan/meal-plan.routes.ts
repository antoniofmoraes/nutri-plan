import { Hono } from 'hono';
import { mealPlanHandler } from './meal-plan.handler.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { Variables } from '../../types/index.js';

const mealPlanRoutes = new Hono<{ Variables: Variables }>();

// All routes are protected
mealPlanRoutes.use('*', authMiddleware);

mealPlanRoutes.get('/', (c) => mealPlanHandler.getAll(c));
mealPlanRoutes.get('/:id', (c) => mealPlanHandler.getById(c));
mealPlanRoutes.post('/', (c) => mealPlanHandler.create(c));
mealPlanRoutes.patch('/:id', (c) => mealPlanHandler.update(c));
mealPlanRoutes.delete('/:id', (c) => mealPlanHandler.delete(c));

export { mealPlanRoutes };
