import { Hono } from 'hono';
import { authHandler } from './auth.handler.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { Variables } from '../../types/index.js';

const authRoutes = new Hono<{ Variables: Variables }>();

// Public routes
authRoutes.post('/register', (c) => authHandler.register(c));
authRoutes.post('/login', (c) => authHandler.login(c));

// Protected routes
authRoutes.get('/me', authMiddleware, (c) => authHandler.getMe(c));
authRoutes.post('/logout', authMiddleware, (c) => authHandler.logout(c));

export { authRoutes };
