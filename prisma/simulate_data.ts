import { PrismaClient } from "../src/generated/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { URL } from "url";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}
const url = new URL(connectionString);

const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: parseInt(url.port || "3306", 10),
  user: url.username,
  password: url.password,
  database: url.pathname.substring(1),
});

const prisma = new PrismaClient();

async function main() {
  console.log("🛠️ Starting Application Simulation Data Population...");

  // 1. Ensure Transaction Types Exist
  const types = ["Deposit", "Withdrawal", "Charge", "Income", "Expense"];
  const typeMap: Record<string, string> = {};

  for (const name of types) {
    const t = await prisma.transactionType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    typeMap[name] = t.id;
  }
  console.log("✅ Transaction types ensured.");

  // 1b. Seed Pricing Plans
  const pricingPlans = [
    { type: "POS" as const, price: 5000, trial: 60 },
    { type: "SME" as const, price: 5000, trial: 60 },
    { type: "CORPORATE" as const, price: 10000, trial: 30 },
    { type: "RETAIL" as const, price: 7500, trial: 30 },
    { type: "PERSONAL" as const, price: 0, trial: 999 },
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
  }
  console.log("✅ Pricing plans seeded.");

  // 2. Setup Simulation Business & Owner
  const hashedSimulationPassword = await bcrypt.hash("password123", 10);

  const corporatePlan = await prisma.pricingPlan.findUnique({
    where: { businessType: "CORPORATE" },
  });
  const trialEndDate = new Date();
  trialEndDate.setDate(
    trialEndDate.getDate() + (corporatePlan?.trialDays || 30),
  );

  const business = await prisma.business.upsert({
    where: { id: "simulation-business" },
    update: {
      type: "CORPORATE",
      trialEndsAt: trialEndDate,
      planId: corporatePlan?.id,
      subscriptionStatus: "TRIAL",
    },
    create: {
      id: "simulation-business",
      name: "SimuCorp Solutions",
      type: "CORPORATE",
      address: "123 Simulation Way, Lagos",
      phone: "08012345678",
      trialEndsAt: trialEndDate,
      planId: corporatePlan?.id,
      subscriptionStatus: "TRIAL",
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@sim.com" },
    update: { password: hashedSimulationPassword },
    create: {
      email: "owner@sim.com",
      name: "Sim Owner",
      password: hashedSimulationPassword,
      role: "OWNER",
      emailVerified: new Date(),
    },
  });

  await prisma.membership.upsert({
    where: { userId_businessId: { userId: owner.id, businessId: business.id } },
    update: { role: "OWNER" },
    create: { userId: owner.id, businessId: business.id, role: "OWNER" },
  });

  // 2b. Setup Super Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@ipbok.com" },
    update: {
      password: hashedSimulationPassword,
      role: "SUPERADMIN",
    },
    create: {
      email: "admin@ipbok.com",
      name: "Global Admin",
      password: hashedSimulationPassword,
      role: "SUPERADMIN",
      emailVerified: new Date(),
    },
  });

  console.log("✅ Super Admin ready (admin@ipbok.com / password123)");

  // 3. Setup Agents/Members
  const agentEmails = ["agent.john@sim.com", "agent.sarah@sim.com"];
  const agents = [];

  for (const email of agentEmails) {
    const name = email.split("@")[0].replace(".", " ");
    const user = await prisma.user.upsert({
      where: { email },
      update: { password: hashedSimulationPassword },
      create: {
        email,
        name,
        password: hashedSimulationPassword,
        role: "AGENT",
        emailVerified: new Date(),
      },
    });

    await prisma.membership.upsert({
      where: {
        userId_businessId: { userId: user.id, businessId: business.id },
      },
      update: { role: "AGENT" },
      create: { userId: user.id, businessId: business.id, role: "AGENT" },
    });

    // Create Financial Accounts for Agents
    await prisma.financialAccount.upsert({
      where: { id: `cash-${user.id}` },
      update: {},
      create: {
        id: `cash-${user.id}`,
        name: `${user.name}'s Cash Wallet`,
        type: "CASH",
        balance: 50000,
        businessId: business.id,
        holderId: user.id,
      },
    });

    agents.push(user);
  }
  console.log("✅ Business and Members ready.");

  // 4. Populate Transactions for the last 6 months
  console.log("⏳ Populating 6 months of transaction history...");
  const months = 6;
  const now = new Date();

  for (let i = 0; i < months; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 15);

    // Income Transactions
    for (let j = 0; j < 5; j++) {
      await prisma.transaction.create({
        data: {
          amount: 5000 + Math.random() * 10000,
          typeId: typeMap["Income"],
          paymentMethod: "CASH",
          recordedById: owner.id,
          businessId: business.id,
          date: new Date(monthDate.getTime() + j * 86400000),
          status: "CONFIRMED",
          description: `Monthly Service Fee ${j + 1}`,
        },
      });
    }

    // Expense Transactions
    for (let j = 0; j < 3; j++) {
      await prisma.transaction.create({
        data: {
          amount: 1000 + Math.random() * 3000,
          typeId: typeMap["Expense"],
          paymentMethod: "BANK_TRANSFER",
          recordedById: owner.id,
          businessId: business.id,
          date: new Date(monthDate.getTime() + j * 126400000),
          status: "CONFIRMED",
          description: `Office Utility ${j + 1}`,
        },
      });
    }
  }

  // 4b. Populate Recent Transactions for the Overview Chart (Last 7 Days)
  console.log("⏳ Populating recent transactions for overview charts...");
  for (let i = 0; i < 7; i++) {
    const recentDate = new Date(now.getTime() - i * 86400000);

    // Deposits (Revenue)
    await prisma.transaction.create({
      data: {
        amount: 8000 + Math.random() * 5000,
        typeId: typeMap["Deposit"],
        paymentMethod: "CASH",
        recordedById: owner.id,
        businessId: business.id,
        date: recentDate,
        status: "CONFIRMED",
        description: `Daily Deposit Day -${i}`,
      },
    });

    // Expenses
    await prisma.transaction.create({
      data: {
        amount: 2000 + Math.random() * 2000,
        typeId: typeMap["Expense"],
        paymentMethod: "CASH",
        recordedById: owner.id,
        businessId: business.id,
        date: recentDate,
        status: "CONFIRMED",
        description: `Daily Expense Day -${i}`,
      },
    });

    // Today's specific Agent Charges (for Profit Distribution)
    if (i === 0) {
      for (const agent of agents) {
        await prisma.transaction.create({
          data: {
            amount: 500 + Math.random() * 1000,
            typeId: typeMap["Charge"],
            paymentMethod: "CASH",
            recordedById: agent.id,
            businessId: business.id,
            date: now,
            status: "CONFIRMED",
            description: `Agent ${agent.name} Service Charge`,
          },
        });
      }
    }
  }
  console.log("✅ Transaction history and recent data populated.");

  // 5. Create active Requests
  await prisma.request.create({
    data: {
      amount: 15000,
      type: "CASH_ADVANCE",
      status: "PENDING",
      description: "Float for tomorrow's field work",
      requesterId: agents[0].id,
      businessId: business.id,
    },
  });

  await prisma.request.create({
    data: {
      amount: 2500,
      type: "EXPENSE_REIMBURSEMENT",
      status: "PENDING",
      description: "Fuel for generator",
      requesterId: agents[1].id,
      businessId: business.id,
    },
  });

  console.log("\n🎉 Simulation Data Successfully Populated!");
  console.log(`
  Login Credentials:
  ------------------
  Owner: owner@sim.com
  Agent 1: agent.john@sim.com
  Agent 2: agent.sarah@sim.com
  Password: password123
  ------------------
  `);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
