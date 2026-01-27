import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { apiReference } from '@scalar/hono-api-reference';

import { errorHandler } from './middlewares/error.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { userRoutes } from './modules/user/user.routes.js';
import { foodRoutes } from './modules/food/food.routes.js';
import { mealPlanRoutes } from './modules/meal-plan/meal-plan.routes.js';
import { mealRoutes } from './modules/meal/meal.routes.js';
import { mealFoodRoutes } from './modules/meal-food/meal-food.routes.js';
import { Variables } from './types/index.js';
import { openApiSpec } from './openapi/spec.js';

const app = new Hono<{ Variables: Variables }>();

// Global middlewares
app.use('*', logger());
app.use('*', cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use('*', errorHandler);

// Health check
app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'NutriPlan API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// OpenAPI JSON spec
app.get('/openapi.json', (c) => {
  return c.json(openApiSpec);
});

// Scalar API Reference UI
app.get(
  '/docs',
  apiReference({
    url: '/openapi.json',
    theme: 'kepler',
    pageTitle: 'NutriPlan API Docs',
  })
);

// API Routes
app.route('/api/auth', authRoutes);
app.route('/api/users', userRoutes);
app.route('/api/foods', foodRoutes);
app.route('/api/meal-plans', mealPlanRoutes);
app.route('/api/meal-plans', mealRoutes); // Nested meals routes
app.route('/api/meals', mealFoodRoutes); // Meal foods routes

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, error: 'Rota não encontrada' }, 404);
});

const port = parseInt(process.env.PORT || '3000', 10);

console.log(`🚀 Server starting on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`✅ Server is running on http://localhost:${info.port}`);
});

export default app;
