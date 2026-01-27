import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import { JWTPayload, Variables } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';

export async function authMiddleware(c: Context<{ Variables: Variables }>, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Token não fornecido' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    c.set('userId', decoded.userId);
    c.set('userEmail', decoded.email);
    
    await next();
  } catch (error) {
    return c.json({ success: false, error: 'Token inválido ou expirado' }, 401);
  }
}
