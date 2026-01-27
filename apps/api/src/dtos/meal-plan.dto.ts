import { z } from 'zod';
import { PlanGoal, WeekDay } from '../types/index.js';

export const createMealPlanSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  goal: z.nativeEnum(PlanGoal),
  dailyCalories: z.number().int().positive('Calorias diárias deve ser positivo'),
  dailyProtein: z.number().int().positive('Proteína deve ser positivo').optional().nullable(),
  dailyCarbs: z.number().int().positive('Carboidratos deve ser positivo').optional().nullable(),
  dailyFat: z.number().int().positive('Gordura deve ser positivo').optional().nullable(),
});

export const updateMealPlanSchema = createMealPlanSchema.partial();

export type CreateMealPlanInput = z.infer<typeof createMealPlanSchema>;
export type UpdateMealPlanInput = z.infer<typeof updateMealPlanSchema>;

// Meal schemas
export const createMealSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  time: z.string().optional(),
});

export const updateMealSchema = createMealSchema.partial();

export type CreateMealInput = z.infer<typeof createMealSchema>;
export type UpdateMealInput = z.infer<typeof updateMealSchema>;

// MealFood schemas
export const addFoodToMealSchema = z.object({
  foodId: z.string().uuid('ID do alimento inválido'),
  quantity: z.number().positive('Quantidade deve ser positivo').default(100),
});

export type AddFoodToMealInput = z.infer<typeof addFoodToMealSchema>;

// Day param validation
export const dayParamSchema = z.object({
  day: z.nativeEnum(WeekDay),
});

export type DayParam = z.infer<typeof dayParamSchema>;
