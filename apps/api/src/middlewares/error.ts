import { Context, Next } from 'hono';
import { ZodError } from 'zod';

export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    console.error('Error:', error);

    if (error instanceof ZodError) {
      return c.json(
        {
          success: false,
          error: 'Dados inválidos',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        400
      );
    }

    if (error instanceof Error) {
      const statusCode = (error as any).statusCode || 500;
      return c.json(
        {
          success: false,
          error: error.message || 'Erro interno do servidor',
        },
        statusCode
      );
    }

    return c.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      500
    );
  }
}
