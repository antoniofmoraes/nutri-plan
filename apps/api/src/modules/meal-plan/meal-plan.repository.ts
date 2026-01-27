import { prisma } from '../../../prisma/client.js';
import { CreateMealPlanInput, UpdateMealPlanInput } from '../../dtos/meal-plan.dto.js';
import { WeekDay } from '../../types/index.js';

const WEEK_DAYS: WeekDay[] = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];

export class MealPlanRepository {
  async findAllByUser(userId: string) {
    return prisma.mealPlan.findMany({
      where: { userId },
      include: {
        days: {
          include: {
            meals: {
              include: {
                foods: {
                  include: {
                    food: true,
                  },
                },
              },
            },
          },
          orderBy: {
            day: 'asc',
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return prisma.mealPlan.findUnique({
      where: { id },
      include: {
        days: {
          include: {
            meals: {
              include: {
                foods: {
                  include: {
                    food: true,
                  },
                },
              },
            },
          },
          orderBy: {
            day: 'asc',
          },
        },
      },
    });
  }

  async create(userId: string, data: CreateMealPlanInput) {
    return prisma.mealPlan.create({
      data: {
        ...data,
        userId,
        days: {
          create: WEEK_DAYS.map((day) => ({ day })),
        },
      },
      include: {
        days: {
          include: {
            meals: {
              include: {
                foods: {
                  include: {
                    food: true,
                  },
                },
              },
            },
          },
          orderBy: {
            day: 'asc',
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateMealPlanInput) {
    return prisma.mealPlan.update({
      where: { id },
      data,
      include: {
        days: {
          include: {
            meals: {
              include: {
                foods: {
                  include: {
                    food: true,
                  },
                },
              },
            },
          },
          orderBy: {
            day: 'asc',
          },
        },
      },
    });
  }

  async delete(id: string) {
    return prisma.mealPlan.delete({
      where: { id },
    });
  }
}

export const mealPlanRepository = new MealPlanRepository();
