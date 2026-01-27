import { z } from 'zod';

export const createFoodSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  calories: z.number().min(0, 'Calorias deve ser positivo'),
  protein: z.number().min(0, 'Proteína deve ser positivo'),
  carbs: z.number().min(0, 'Carboidratos deve ser positivo'),
  fat: z.number().min(0, 'Gordura deve ser positivo'),
  portion: z.string().default('100g'),
});

export const updateFoodSchema = createFoodSchema.partial();

export type CreateFoodInput = z.infer<typeof createFoodSchema>;
export type UpdateFoodInput = z.infer<typeof updateFoodSchema>;

export interface FoodResponse {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
}
