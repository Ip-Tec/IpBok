
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const types = await prisma.transactionType.findMany();
  console.log("ALL TYPES:", types);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
