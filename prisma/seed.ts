import { PrismaClient } from "../src/generated";

// @ts-ignore
const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL || "",
});

async function main() {
  const transactionTypes = [
    "Deposit",
    "Withdrawal",
    "Charge",
    "Cash Advance",
    "Reconciliation",
    "Income",
    "Expense",
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

  const pricingPlans = [
    { type: "POS" as any, price: 5000, trial: 60 },
    { type: "SME" as any, price: 5000, trial: 60 },
    { type: "CORPORATE" as any, price: 10000, trial: 30 },
    { type: "RETAIL" as any, price: 7500, trial: 30 },
    { type: "PERSONAL" as any, price: 0, trial: 999 },
  ];

  for (const plan of pricingPlans) {
    await prisma.pricingPlan.upsert({
      where: { businessType: plan.type },
      update: { monthlyPrice: plan.price, trialDays: plan.trial },
      create: {
        businessType: plan.type,
        monthlyPrice: plan.price,
        trialDays: plan.trial,
      },
    });
    console.log(`"${plan.type}" pricing plan ensured.`);
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
