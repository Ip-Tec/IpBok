
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Hello from debug script");
  console.log("Fetching all Transaction Types...");
  const types = await prisma.transactionType.findMany();
  console.log("Transaction Types found:", types);

  console.log("\nFetching Transaction Counts by Type Name:");
  const transactions = await prisma.transaction.groupBy({
    by: ['typeId'],
    _count: {
      _all: true,
    },
  });

  for (const t of transactions) {
    const typeName = types.find(type => type.id === t.typeId)?.name || 'Unknown';
    console.log(`Type: ${typeName}, Count: ${t._count._all} (ID: ${t.typeId})`);
  }
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
