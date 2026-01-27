import { foodRepository } from './food.repository.js';
import { CreateFoodInput, UpdateFoodInput } from '../../dtos/food.dto.js';

export class FoodService {
  async getAllFoods(search?: string) {
    return foodRepository.findAll(search);
  }

  async getFoodById(id: string) {
    const food = await foodRepository.findById(id);

    if (!food) {
      const error = new Error('Alimento não encontrado') as any;
      error.statusCode = 404;
      throw error;
    }

    return food;
  }

  async createFood(input: CreateFoodInput) {
    return foodRepository.create(input);
  }

  async updateFood(id: string, input: UpdateFoodInput) {
    const food = await foodRepository.findById(id);

    if (!food) {
      const error = new Error('Alimento não encontrado') as any;
      error.statusCode = 404;
      throw error;
    }

    return foodRepository.update(id, input);
  }

  async deleteFood(id: string) {
    const food = await foodRepository.findById(id);

    if (!food) {
      const error = new Error('Alimento não encontrado') as any;
      error.statusCode = 404;
      throw error;
    }

    await foodRepository.delete(id);
    return { message: 'Alimento excluído com sucesso' };
  }
}

export const foodService = new FoodService();
