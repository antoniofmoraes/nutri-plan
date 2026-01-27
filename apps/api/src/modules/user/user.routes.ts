import { Hono } from 'hono';
import { userHandler } from './user.handler.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { Variables } from '../../types/index.js';

const userRoutes = new Hono<{ Variables: Variables }>();

// All routes are protected
userRoutes.use('*', authMiddleware);

userRoutes.get('/me', (c) => userHandler.getUser(c));
userRoutes.patch('/me', (c) => userHandler.updateUser(c));
userRoutes.delete('/me', (c) => userHandler.deleteUser(c));

export { userRoutes };
