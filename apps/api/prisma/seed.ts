import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultFoods = [
  { name: 'Frango Grelhado', calories: 165, protein: 31, carbs: 0, fat: 3.6, portion: '100g' },
  { name: 'Arroz Branco', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, portion: '100g' },
  { name: 'Feijão Preto', calories: 132, protein: 8.9, carbs: 23.7, fat: 0.5, portion: '100g' },
  { name: 'Ovo Cozido', calories: 155, protein: 13, carbs: 1.1, fat: 11, portion: '100g' },
  { name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, portion: '100g' },
  { name: 'Aveia', calories: 389, protein: 16.9, carbs: 66, fat: 6.9, portion: '100g' },
  { name: 'Batata Doce', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, portion: '100g' },
  { name: 'Peito de Peru', calories: 104, protein: 17.1, carbs: 4.2, fat: 1.7, portion: '100g' },
  { name: 'Iogurte Natural', calories: 59, protein: 3.5, carbs: 4.7, fat: 3.3, portion: '100g' },
  { name: 'Whey Protein', calories: 120, protein: 24, carbs: 3, fat: 1, portion: '30g' },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Check if foods already exist
  const existingFoods = await prisma.food.count();
  
  if (existingFoods === 0) {
    await prisma.food.createMany({
      data: defaultFoods,
    });
    console.log(`✅ Created ${defaultFoods.length} default foods`);
  } else {
    console.log(`⏭️  Foods already exist (${existingFoods}), skipping seed`);
  }

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
