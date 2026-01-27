import { Hono } from 'hono';
import { foodHandler } from './food.handler.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { Variables } from '../../types/index.js';

const foodRoutes = new Hono<{ Variables: Variables }>();

// All routes are protected
foodRoutes.use('*', authMiddleware);

foodRoutes.get('/', (c) => foodHandler.getAllFoods(c));
foodRoutes.get('/:id', (c) => foodHandler.getFoodById(c));
foodRoutes.post('/', (c) => foodHandler.createFood(c));
foodRoutes.patch('/:id', (c) => foodHandler.updateFood(c));
foodRoutes.delete('/:id', (c) => foodHandler.deleteFood(c));

export { foodRoutes };
