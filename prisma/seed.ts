import { PrismaClient } from '../src/generated';

// @ts-ignore
const prisma = new PrismaClient({ accelerateUrl: process.env.DATABASE_URL || "" });

async function main() {
  const transactionTypes = [
    'Deposit',
    'Withdrawal',
    'Charge',
    'Cash Advance',
    'Reconciliation',
    'Income',
    'Expense',
  ];

  for (const typeName of transactionTypes) {
    const transactionType = await prisma.transactionType.findUnique({
      where: { name: typeName },
    });

    if (!transactionType) {
      await prisma.transactionType.create({
        data: {
          name: typeName,
        },
      });
      console.log(`"${typeName}" transaction type created.`);
    } else {
      console.log(`"${typeName}" transaction type already exists.`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
