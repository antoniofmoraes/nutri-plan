import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  email: z.string().email('Email inválido').optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}
