import { Context } from 'hono';
import { userService } from './user.service.js';
import { updateUserSchema } from '../../dtos/user.dto.js';
import { Variables } from '../../types/index.js';

export class UserHandler {
  async getUser(c: Context<{ Variables: Variables }>) {
    const userId = c.get('userId');
    const user = await userService.getUser(userId);
    
    return c.json({ success: true, data: user });
  }

  async updateUser(c: Context<{ Variables: Variables }>) {
    const userId = c.get('userId');
    const body = await c.req.json();
    const input = updateUserSchema.parse(body);
    const user = await userService.updateUser(userId, input);
    
    return c.json({ success: true, data: user });
  }

  async deleteUser(c: Context<{ Variables: Variables }>) {
    const userId = c.get('userId');
    const result = await userService.deleteUser(userId);
    
    return c.json({ success: true, ...result });
  }
}

export const userHandler = new UserHandler();
