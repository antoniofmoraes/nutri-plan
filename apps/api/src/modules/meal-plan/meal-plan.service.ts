import { mealPlanRepository } from './meal-plan.repository.js';
import { CreateMealPlanInput, UpdateMealPlanInput } from '../../dtos/meal-plan.dto.js';

export class MealPlanService {
  async getAllByUser(userId: string) {
    return mealPlanRepository.findAllByUser(userId);
  }

  async getById(id: string, userId: string) {
    const plan = await mealPlanRepository.findById(id);

    if (!plan) {
      const error = new Error('Plano alimentar não encontrado') as any;
      error.statusCode = 404;
      throw error;
    }

    if (plan.userId !== userId) {
      const error = new Error('Acesso negado') as any;
      error.statusCode = 403;
      throw error;
    }

    return plan;
  }

  async create(userId: string, input: CreateMealPlanInput) {
    return mealPlanRepository.create(userId, input);
  }

  async update(id: string, userId: string, input: UpdateMealPlanInput) {
    const plan = await mealPlanRepository.findById(id);

    if (!plan) {
      const error = new Error('Plano alimentar não encontrado') as any;
      error.statusCode = 404;
      throw error;
    }

    if (plan.userId !== userId) {
      const error = new Error('Acesso negado') as any;
      error.statusCode = 403;
      throw error;
    }

    return mealPlanRepository.update(id, input);
  }

  async delete(id: string, userId: string) {
    const plan = await mealPlanRepository.findById(id);

    if (!plan) {
      const error = new Error('Plano alimentar não encontrado') as any;
      error.statusCode = 404;
      throw error;
    }

    if (plan.userId !== userId) {
      const error = new Error('Acesso negado') as any;
      error.statusCode = 403;
      throw error;
    }

    await mealPlanRepository.delete(id);
    return { message: 'Plano alimentar excluído com sucesso' };
  }
}

export const mealPlanService = new MealPlanService();
