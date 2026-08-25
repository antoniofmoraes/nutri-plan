import { describe, it, expect } from "vitest";
import {
  calculateFoodMacros,
  calculateRawMealMacros,
  getFoodPortionGrams,
  buildSlotAverages,
  calculateMealMacros,
  calculateDayMacros,
  calculatePlanMacros,
} from "./macros";
import type { Meal, DayPlan, MealPlan, Food } from "@/types";

const rice: Food = {
  id: "1",
  name: "Arroz branco",
  calories: 130,
  protein: 2.7,
  carbs: 28,
  fat: 0.3,
  fibers: 0.4,
};

const chicken: Food = {
  id: "2",
  name: "Frango grelhado",
  calories: 165,
  protein: 31,
  carbs: 0,
  fat: 3.6,
  fibers: 0,
};

function makeMeal(overrides: Partial<Meal> = {}): Meal {
  return {
    id: "m1",
    slotId: "slot-almoco",
    name: "Almoço",
    isCheat: false,
    foods: [],
    ...overrides,
  };
}

function makePlan(days: DayPlan[]): MealPlan {
  return {
    id: "p1",
    name: "Plano teste",
    goal: "manter",
    dailyCalories: 2000,
    isMain: false,
    slots: [{ id: "slot-almoco", name: "Almoço", sortOrder: 0 }],
    days,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("calculateRawMealMacros", () => {
  it("retorna zeros para refeição sem alimentos", () => {
    const meal = makeMeal();
    expect(calculateRawMealMacros(meal)).toEqual({
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  });

  it("calcula macros proporcionais à quantidade (base 100g)", () => {
    const meal = makeMeal({
      foods: [{ food: rice, quantity: 200 }],
    });
    const result = calculateRawMealMacros(meal);
    expect(result.calories).toBeCloseTo(260);
    expect(result.protein).toBeCloseTo(5.4);
    expect(result.carbs).toBeCloseTo(56);
    expect(result.fat).toBeCloseTo(0.6);
  });

  it("soma múltiplos alimentos", () => {
    const meal = makeMeal({
      foods: [
        { food: rice, quantity: 100 },
        { food: chicken, quantity: 100 },
      ],
    });
    const result = calculateRawMealMacros(meal);
    expect(result.calories).toBeCloseTo(295);
    expect(result.protein).toBeCloseTo(33.7);
    expect(result.carbs).toBeCloseTo(28);
    expect(result.fat).toBeCloseTo(3.9);
  });

  it("funciona com quantidade fracionária", () => {
    const meal = makeMeal({
      foods: [{ food: rice, quantity: 50 }],
    });
    const result = calculateRawMealMacros(meal);
    expect(result.calories).toBeCloseTo(65);
  });

  it("usa a porção cadastrada como base dos macros", () => {
    const meal = makeMeal({
      foods: [{
        food: { ...rice, calories: 484, protein: 36.4, carbs: 52.9, fat: 14.2, portion: "370g" },
        quantity: 370,
      }],
    });

    const result = calculateRawMealMacros(meal);
    expect(result.calories).toBeCloseTo(484);
    expect(result.protein).toBeCloseTo(36.4);
    expect(result.carbs).toBeCloseTo(52.9);
    expect(result.fat).toBeCloseTo(14.2);
  });
});

describe("food portions", () => {
  it("interpreta gramas com espaço e vírgula decimal", () => {
    expect(getFoodPortionGrams("Porção 370 g")).toBe(370);
    expect(getFoodPortionGrams("12,5 gramas")).toBe(12.5);
  });

  it("usa 100g quando a porção não informa gramas", () => {
    expect(getFoodPortionGrams("1 unidade")).toBe(100);
    expect(getFoodPortionGrams()).toBe(100);
  });

  it("calcula quantidades proporcionais à porção", () => {
    const macros = calculateFoodMacros(
      { calories: 484, protein: 36.4, carbs: 52.9, fat: 14.2, portion: "370g" },
      185
    );
    expect(macros.calories).toBeCloseTo(242);
    expect(macros.protein).toBeCloseTo(18.2);
  });
});

describe("buildSlotAverages", () => {
  it("calcula média por slot excluindo cheat meals", () => {
    const plan = makePlan([
      {
        day: "segunda",
        meals: [
          makeMeal({ foods: [{ food: rice, quantity: 100 }] }),
          makeMeal({ isCheat: true, foods: [] }),
        ],
      },
      {
        day: "terca",
        meals: [
          makeMeal({ foods: [{ food: rice, quantity: 200 }] }),
        ],
      },
    ]);

    const averages = buildSlotAverages(plan);
    const avg = averages.get("slot-almoco")!;
    expect(avg.calories).toBeCloseTo((130 + 260) / 2);
    expect(avg.protein).toBeCloseTo((2.7 + 5.4) / 2);
  });

  it("retorna mapa vazio se todos os meals são cheat", () => {
    const plan = makePlan([
      {
        day: "segunda",
        meals: [makeMeal({ isCheat: true, foods: [] })],
      },
    ]);
    const averages = buildSlotAverages(plan);
    expect(averages.size).toBe(0);
  });
});

describe("calculateMealMacros", () => {
  it("retorna macros raw para refeição normal", () => {
    const meal = makeMeal({ foods: [{ food: rice, quantity: 100 }] });
    const result = calculateMealMacros(meal);
    expect(result.calories).toBeCloseTo(130);
  });

  it("retorna média do slot para cheat meal quando plan fornecido", () => {
    const normalMeal = makeMeal({
      id: "m-normal",
      foods: [{ food: chicken, quantity: 100 }],
    });
    const cheatMeal = makeMeal({
      id: "m-cheat",
      isCheat: true,
      foods: [{ food: rice, quantity: 500 }],
    });
    const plan = makePlan([
      { day: "segunda", meals: [normalMeal] },
      { day: "terca", meals: [cheatMeal] },
    ]);

    const result = calculateMealMacros(cheatMeal, plan);
    expect(result.calories).toBeCloseTo(165);
    expect(result.protein).toBeCloseTo(31);
  });

  it("retorna macros raw para cheat meal sem plan", () => {
    const cheatMeal = makeMeal({
      isCheat: true,
      foods: [{ food: rice, quantity: 100 }],
    });
    const result = calculateMealMacros(cheatMeal);
    expect(result.calories).toBeCloseTo(130);
  });

  it("retorna zeros para cheat meal quando slot só tem cheats", () => {
    const cheatMeal = makeMeal({
      id: "m-cheat",
      isCheat: true,
      foods: [{ food: rice, quantity: 300 }],
    });
    const plan = makePlan([
      { day: "segunda", meals: [cheatMeal] },
    ]);
    const result = calculateMealMacros(cheatMeal, plan);
    expect(result).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });
});

describe("calculateDayMacros", () => {
  it("soma todas as refeições do dia", () => {
    const day: DayPlan = {
      day: "segunda",
      meals: [
        makeMeal({
          id: "m1",
          slotId: "slot-almoco",
          foods: [{ food: rice, quantity: 100 }],
        }),
        makeMeal({
          id: "m2",
          slotId: "slot-janta",
          name: "Janta",
          foods: [{ food: chicken, quantity: 100 }],
        }),
      ],
    };
    const result = calculateDayMacros(day);
    expect(result.calories).toBeCloseTo(295);
    expect(result.protein).toBeCloseTo(33.7);
  });

  it("substitui cheat meal pela média do slot quando plan fornecido", () => {
    const normalMeal = makeMeal({
      id: "m-normal",
      foods: [{ food: chicken, quantity: 100 }],
    });
    const cheatMeal = makeMeal({
      id: "m-cheat",
      isCheat: true,
      foods: [],
    });
    const plan = makePlan([
      { day: "segunda", meals: [normalMeal] },
      { day: "terca", meals: [cheatMeal] },
    ]);

    const dayWithCheat: DayPlan = { day: "terca", meals: [cheatMeal] };
    const result = calculateDayMacros(dayWithCheat, plan);
    expect(result.calories).toBeCloseTo(165);
  });

  it("soma cheat (via média) e normal no mesmo dia", () => {
    const normalAlmoco = makeMeal({
      id: "m-almoco",
      slotId: "slot-almoco",
      foods: [{ food: rice, quantity: 100 }],
    });
    const cheatJanta = makeMeal({
      id: "m-janta",
      slotId: "slot-janta",
      name: "Janta",
      isCheat: true,
      foods: [],
    });
    const normalJantaOutroDia = makeMeal({
      id: "m-janta-seg",
      slotId: "slot-janta",
      name: "Janta",
      foods: [{ food: chicken, quantity: 200 }],
    });

    const plan: MealPlan = {
      ...makePlan([]),
      slots: [
        { id: "slot-almoco", name: "Almoço", sortOrder: 0 },
        { id: "slot-janta", name: "Janta", sortOrder: 1 },
      ],
      days: [
        { day: "segunda", meals: [normalJantaOutroDia] },
        { day: "terca", meals: [normalAlmoco, cheatJanta] },
      ],
    };

    const dayMixed: DayPlan = { day: "terca", meals: [normalAlmoco, cheatJanta] };
    const result = calculateDayMacros(dayMixed, plan);
    expect(result.calories).toBeCloseTo(130 + 330);
    expect(result.protein).toBeCloseTo(2.7 + 62);
  });
});

describe("calculatePlanMacros", () => {
  it("calcula média diária dividindo por 7", () => {
    const meals = [
      makeMeal({ foods: [{ food: rice, quantity: 100 }] }),
    ];
    const plan = makePlan([
      { day: "segunda", meals },
      { day: "terca", meals },
      { day: "quarta", meals },
      { day: "quinta", meals },
      { day: "sexta", meals },
      { day: "sabado", meals },
      { day: "domingo", meals },
    ]);

    const result = calculatePlanMacros(plan);
    expect(result.calories).toBeCloseTo(130);
    expect(result.protein).toBeCloseTo(2.7);
  });

  it("substitui cheat meal pela média do slot (ignora os alimentos do cheat)", () => {
    const plan = makePlan([
      {
        day: "segunda",
        meals: [makeMeal({ id: "m-normal", foods: [{ food: rice, quantity: 700 }] })],
      },
      {
        day: "terca",
        meals: [makeMeal({ id: "m-cheat", isCheat: true, foods: [{ food: chicken, quantity: 9999 }] })],
      },
      { day: "quarta", meals: [] },
      { day: "quinta", meals: [] },
      { day: "sexta", meals: [] },
      { day: "sabado", meals: [] },
      { day: "domingo", meals: [] },
    ]);

    // cheat conta como a média do slot (910), não como seus alimentos nem zero
    const result = calculatePlanMacros(plan);
    expect(result.calories).toBeCloseTo((910 + 910) / 7);
  });

  it("cheat meal contribui zero quando o slot não tem refeições normais", () => {
    const plan = makePlan([
      {
        day: "segunda",
        meals: [makeMeal({ id: "m-cheat", isCheat: true, foods: [{ food: chicken, quantity: 9999 }] })],
      },
      { day: "terca", meals: [] },
      { day: "quarta", meals: [] },
      { day: "quinta", meals: [] },
      { day: "sexta", meals: [] },
      { day: "sabado", meals: [] },
      { day: "domingo", meals: [] },
    ]);

    const result = calculatePlanMacros(plan);
    expect(result.calories).toBe(0);
  });

  it("retorna zeros para plano sem refeições", () => {
    const plan = makePlan([
      { day: "segunda", meals: [] },
      { day: "terca", meals: [] },
      { day: "quarta", meals: [] },
      { day: "quinta", meals: [] },
      { day: "sexta", meals: [] },
      { day: "sabado", meals: [] },
      { day: "domingo", meals: [] },
    ]);

    const result = calculatePlanMacros(plan);
    expect(result.calories).toBe(0);
    expect(result.protein).toBe(0);
  });
});
