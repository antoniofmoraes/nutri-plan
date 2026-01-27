import { prisma } from '../../../prisma/client.js';
import { CreateMealInput, UpdateMealInput } from '../../dtos/meal-plan.dto.js';
import { WeekDay } from '../../types/index.js';

export class MealRepository {
  async findDayPlan(mealPlanId: string, day: WeekDay) {
    return prisma.dayPlan.findUnique({
      where: {
        mealPlanId_day: {
          mealPlanId,
          day,
        },
      },
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
    });
  }

  async findMealById(id: string) {
    return prisma.meal.findUnique({
      where: { id },
      include: {
        foods: {
          include: {
            food: true,
          },
        },
        dayPlan: {
          include: {
            mealPlan: true,
          },
        },
      },
    });
  }

  async create(dayPlanId: string, data: CreateMealInput) {
    return prisma.meal.create({
      data: {
        ...data,
        dayPlanId,
      },
      include: {
        foods: {
          include: {
            food: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateMealInput) {
    return prisma.meal.update({
      where: { id },
      data,
      include: {
        foods: {
          include: {
            food: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    return prisma.meal.delete({
      where: { id },
    });
  }
}

export const mealRepository = new MealRepository();
