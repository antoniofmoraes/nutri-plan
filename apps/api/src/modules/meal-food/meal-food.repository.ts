import { prisma } from '../../../prisma/client.js';

export class MealFoodRepository {
  async findMealById(mealId: string) {
    return prisma.meal.findUnique({
      where: { id: mealId },
      include: {
        dayPlan: {
          include: {
            mealPlan: true,
          },
        },
      },
    });
  }

  async findFoodById(foodId: string) {
    return prisma.food.findUnique({
      where: { id: foodId },
    });
  }

  async findMealFood(mealId: string, foodId: string) {
    return prisma.mealFood.findUnique({
      where: {
        mealId_foodId: {
          mealId,
          foodId,
        },
      },
    });
  }

  async addFoodToMeal(mealId: string, foodId: string, quantity: number) {
    return prisma.mealFood.create({
      data: {
        mealId,
        foodId,
        quantity,
      },
      include: {
        food: true,
      },
    });
  }

  async updateQuantity(mealId: string, foodId: string, quantity: number) {
    return prisma.mealFood.update({
      where: {
        mealId_foodId: {
          mealId,
          foodId,
        },
      },
      data: { quantity },
      include: {
        food: true,
      },
    });
  }

  async removeFoodFromMeal(mealId: string, foodId: string) {
    return prisma.mealFood.delete({
      where: {
        mealId_foodId: {
          mealId,
          foodId,
        },
      },
    });
  }

  async getMealWithFoods(mealId: string) {
    return prisma.meal.findUnique({
      where: { id: mealId },
      include: {
        foods: {
          include: {
            food: true,
          },
        },
      },
    });
  }
}

export const mealFoodRepository = new MealFoodRepository();
