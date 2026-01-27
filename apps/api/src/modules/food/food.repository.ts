import { prisma } from '../../../prisma/client.js';
import { CreateFoodInput, UpdateFoodInput } from '../../dtos/food.dto.js';

export class FoodRepository {
  async findAll(search?: string) {
    return prisma.food.findMany({
      where: search
        ? {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          }
        : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.food.findUnique({
      where: { id },
    });
  }

  async create(data: CreateFoodInput) {
    return prisma.food.create({
      data,
    });
  }

  async update(id: string, data: UpdateFoodInput) {
    return prisma.food.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.food.delete({
      where: { id },
    });
  }
}

export const foodRepository = new FoodRepository();
