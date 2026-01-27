import { Context } from 'hono';
import { authService } from './auth.service.js';
import { registerSchema, loginSchema } from '../../dtos/auth.dto.js';
import { Variables } from '../../types/index.js';

export class AuthHandler {
  async register(c: Context) {
    const body = await c.req.json();
    const input = registerSchema.parse(body);
    const result = await authService.register(input);
    
    return c.json({ success: true, data: result }, 201);
  }

  async login(c: Context) {
    const body = await c.req.json();
    const input = loginSchema.parse(body);
    const result = await authService.login(input);
    
    return c.json({ success: true, data: result });
  }

  async getMe(c: Context<{ Variables: Variables }>) {
    const userId = c.get('userId');
    const user = await authService.getMe(userId);
    
    return c.json({ success: true, data: user });
  }

  async logout(c: Context) {
    // JWT is stateless, logout is handled client-side
    return c.json({ success: true, message: 'Logout realizado com sucesso' });
  }
}

export const authHandler = new AuthHandler();
