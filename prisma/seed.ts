import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

  console.log("Seeding transaction types...");
  for (const typeName of transactionTypes) {
    await prisma.transactionType.upsert({
      where: { name: typeName },
      update: {},
      create: { name: typeName },
    });
    console.log(`- ${typeName}`);
  }

  const pricingPlans = [
    { type: "POS", price: 5000, trial: 60 },
    { type: "SME", price: 5000, trial: 60 },
    { type: "CORPORATE", price: 10000, trial: 30 },
    { type: "RETAIL", price: 7500, trial: 30 },
    { type: "PERSONAL", price: 0, trial: 999 },
  ];

  console.log("Seeding pricing plans...");
  for (const plan of pricingPlans) {
    await prisma.pricingPlan.upsert({
      where: { businessType: plan.type as any },
      update: { monthlyPrice: plan.price, trialDays: plan.trial },
      create: {
        businessType: plan.type as any,
        monthlyPrice: plan.price,
        trialDays: plan.trial,
      },
    });
    console.log(`- ${plan.type}`);
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
