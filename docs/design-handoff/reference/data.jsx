// data.jsx — mock data store for PORTIO

const DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const DAYS_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const DAYS_LETTER = ["S", "T", "Q", "Q", "S", "S", "D"];

const FOODS = [
  { id: "f1",  name: "Frango grelhado",       portion: "100g", cal: 165, p: 31,  c: 0,    f: 3.6, fib: 0 },
  { id: "f2",  name: "Arroz branco cozido",    portion: "100g", cal: 130, p: 2.7, c: 28,   f: 0.3, fib: 0.4 },
  { id: "f3",  name: "Arroz integral cozido",  portion: "100g", cal: 124, p: 2.6, c: 26,   f: 1.0, fib: 1.8 },
  { id: "f4",  name: "Batata-doce cozida",     portion: "100g", cal:  86, p: 1.6, c: 20,   f: 0.1, fib: 3.0 },
  { id: "f5",  name: "Feijão preto cozido",    portion: "100g", cal: 132, p: 8.9, c: 24,   f: 0.5, fib: 8.7 },
  { id: "f6",  name: "Ovo de galinha",         portion: "1 un (50g)", cal: 78, p: 6.3, c: 0.6, f: 5.3, fib: 0 },
  { id: "f7",  name: "Aveia em flocos",         portion: "100g", cal: 389, p: 17,  c: 66,   f: 7,   fib: 11 },
  { id: "f8",  name: "Banana prata",            portion: "100g", cal:  98, p: 1.4, c: 26,   f: 0.1, fib: 2 },
  { id: "f9",  name: "Maçã",                   portion: "100g", cal:  52, p: 0.3, c: 14,   f: 0.2, fib: 2.4 },
  { id: "f10", name: "Pão integral",            portion: "1 fatia (28g)", cal: 69, p: 3.6, c: 12, f: 1, fib: 1.9 },
  { id: "f11", name: "Whey protein (isolado)",  portion: "30g",  cal: 117, p: 25,  c: 1.5,  f: 1.0, fib: 0 },
  { id: "f12", name: "Iogurte natural desnatado", portion: "100g", cal: 56, p: 5.7, c: 7.7, f: 0.2, fib: 0 },
  { id: "f13", name: "Azeite extra virgem",     portion: "1 colher (10ml)", cal: 88, p: 0, c: 0, f: 10, fib: 0 },
  { id: "f14", name: "Salmão grelhado",         portion: "100g", cal: 208, p: 22,  c: 0,    f: 13,  fib: 0 },
  { id: "f15", name: "Brócolis cozido",         portion: "100g", cal:  35, p: 2.4, c: 7.2,  f: 0.4, fib: 3.3 },
  { id: "f16", name: "Pasta de amendoim",       portion: "1 colher (15g)", cal: 89, p: 3.8, c: 3, f: 7.5, fib: 1 },
  { id: "f17", name: "Quinoa cozida",           portion: "100g", cal: 120, p: 4.4, c: 21,   f: 1.9, fib: 2.8 },
  { id: "f18", name: "Atum em conserva",        portion: "100g", cal: 116, p: 26,  c: 0,    f: 1.0, fib: 0 },
  { id: "f19", name: "Tomate",                  portion: "100g", cal:  18, p: 0.9, c: 3.9,  f: 0.2, fib: 1.2 },
  { id: "f20", name: "Alface americana",        portion: "100g", cal:  15, p: 0.9, c: 2.9,  f: 0.1, fib: 1.3 },
  { id: "f21", name: "Tapioca",                 portion: "100g", cal: 358, p: 0.2, c: 89,   f: 0,   fib: 0.9 },
  { id: "f22", name: "Queijo cottage",          portion: "100g", cal:  98, p: 11,  c: 3.4,  f: 4.3, fib: 0 },
  { id: "f23", name: "Castanha-do-pará",        portion: "1 un (5g)", cal: 33, p: 0.7, c: 0.6, f: 3.3, fib: 0.4 },
  { id: "f24", name: "Leite desnatado",         portion: "200ml", cal: 70, p: 7,    c: 10,   f: 0.4, fib: 0 },
];

const foodById = (id) => FOODS.find((x) => x.id === id);

// Helper to scale a food by quantity (grams or units, treated linearly off portion)
function scaleFood(foodId, qty) {
  const f = foodById(foodId); if (!f) return null;
  // Portion is in grams in most cases; we just treat qty as grams and scale linearly off /100g for /100g foods.
  // For per-unit foods we still scale by qty (interpreting qty as grams of that thing).
  const k = qty / 100;
  return { ...f, qty, cal: f.cal * k, p: f.p * k, c: f.c * k, f: f.f * k, fib: f.fib * k };
}

function sumMacros(items) {
  return items.reduce((acc, it) => {
    const s = scaleFood(it.foodId, it.qty);
    if (!s) return acc;
    acc.cal += s.cal; acc.p += s.p; acc.c += s.c; acc.f += s.f; acc.fib += s.fib;
    return acc;
  }, { cal: 0, p: 0, c: 0, f: 0, fib: 0 });
}

// 6 meal slots
const SLOTS = [
  { id: "s1", name: "Café da manhã", time: "07:00" },
  { id: "s2", name: "Lanche da manhã", time: "10:00" },
  { id: "s3", name: "Almoço",         time: "12:30" },
  { id: "s4", name: "Pré-treino",     time: "15:30" },
  { id: "s5", name: "Pós-treino",     time: "17:30" },
  { id: "s6", name: "Jantar",         time: "20:00" },
];

// 7-day meal plan. Generates per-(day, slot) entries with foods.
function genWeek() {
  // recipes for each slot
  const base = {
    s1: [["f7", 60], ["f8", 100], ["f24", 200]],          // aveia + banana + leite
    s2: [["f6", 100], ["f10", 56]],                        // ovos + pão
    s3: [["f1", 150], ["f3", 150], ["f15", 80], ["f13", 10]], // frango + arroz + brócolis + azeite
    s4: [["f9", 130], ["f16", 15]],
    s5: [["f11", 30], ["f8", 100]],
    s6: [["f14", 130], ["f4", 200], ["f20", 60]],
  };
  const week = {};
  DAYS.forEach((d, di) => {
    week[di] = {};
    SLOTS.forEach((sl) => {
      const recipe = base[sl.id] || [];
      week[di][sl.id] = {
        cheat: di === 5 && sl.id === "s6", // Saturday dinner
        items: recipe.map(([foodId, qty]) => ({ foodId, qty })),
      };
    });
    // tiny variation per day
    if (di % 2 === 1) {
      week[di].s3 = { cheat: false, items: [
        { foodId: "f14", qty: 120 }, { foodId: "f17", qty: 130 },
        { foodId: "f15", qty: 80 },  { foodId: "f13", qty: 10 },
      ]};
    }
    if (di === 3) {
      week[di].s5 = { cheat: false, items: [
        { foodId: "f22", qty: 100 }, { foodId: "f9", qty: 130 },
      ]};
    }
  });
  return week;
}

const PLANS = [
  {
    id: "p1", name: "Manutenção · Semana atual",
    goal: "Manutenção", target: { cal: 2200, p: 165, c: 240, f: 70 },
    main: true,
    slots: SLOTS,
    week: genWeek(),
  },
  {
    id: "p2", name: "Cutting outubro",
    goal: "Emagrecimento", target: { cal: 1800, p: 170, c: 170, f: 55 },
    main: false,
    slots: SLOTS.slice(0, 5),
    week: genWeek(),
  },
  {
    id: "p3", name: "Bulking limpo",
    goal: "Ganho de Massa", target: { cal: 2900, p: 190, c: 340, f: 85 },
    main: false,
    slots: SLOTS,
    week: genWeek(),
  },
];

const PRESETS = [
  {
    id: "pr1", name: "Omelete fitness",
    items: [{ foodId: "f6", qty: 150 }, { foodId: "f22", qty: 60 }, { foodId: "f19", qty: 50 }],
  },
  {
    id: "pr2", name: "Marmita padrão",
    items: [{ foodId: "f1", qty: 180 }, { foodId: "f3", qty: 150 }, { foodId: "f15", qty: 100 }, { foodId: "f13", qty: 10 }],
  },
  {
    id: "pr3", name: "Shake pós-treino",
    items: [{ foodId: "f11", qty: 30 }, { foodId: "f8", qty: 120 }, { foodId: "f24", qty: 200 }],
  },
  {
    id: "pr4", name: "Salada de salmão",
    items: [{ foodId: "f14", qty: 130 }, { foodId: "f20", qty: 80 }, { foodId: "f19", qty: 80 }, { foodId: "f13", qty: 10 }],
  },
];

const SHOPPING_LISTS = [
  {
    id: "sl1", name: "Compras da semana", ownerSelf: true,
    selectedMeals: 14, members: [
      { name: "Você", email: "voce@portio.app", role: "Proprietário", initials: "V" },
      { name: "Marina Costa", email: "marina@exemplo.com", role: "Membro", initials: "MC" },
    ],
    items: [
      { name: "Frango grelhado", qty: 1200, unit: "g" },
      { name: "Arroz integral", qty: 900, unit: "g" },
      { name: "Salmão", qty: 520, unit: "g" },
      { name: "Brócolis", qty: 700, unit: "g" },
      { name: "Batata-doce", qty: 800, unit: "g" },
      { name: "Ovos", qty: 14, unit: "un" },
      { name: "Aveia", qty: 420, unit: "g" },
      { name: "Banana prata", qty: 14, unit: "un" },
      { name: "Iogurte natural", qty: 500, unit: "g" },
      { name: "Azeite extra virgem", qty: 100, unit: "ml" },
    ],
  },
  {
    id: "sl2", name: "Festa de sábado", ownerSelf: false, invitedBy: "Marina Costa",
    selectedMeals: 3, members: [
      { name: "Marina Costa", email: "marina@exemplo.com", role: "Proprietário", initials: "MC" },
      { name: "Você", email: "voce@portio.app", role: "Membro", initials: "V" },
    ],
    items: [
      { name: "Pão integral", qty: 4, unit: "un" },
      { name: "Queijo cottage", qty: 300, unit: "g" },
    ],
  },
];

const USER = {
  name: "Daniel Vieira",
  firstName: "Daniel",
  email: "daniel@portio.app",
  initials: "DV",
};

Object.assign(window, {
  DAYS, DAYS_SHORT, DAYS_LETTER,
  FOODS, foodById, scaleFood, sumMacros,
  SLOTS, PLANS, PRESETS, SHOPPING_LISTS, USER,
});
