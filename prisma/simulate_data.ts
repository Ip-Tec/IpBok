import { PrismaClient } from '../src/generated';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log("🛠️ Starting Application Simulation Data Population...");

  // 1. Ensure Transaction Types Exist
  const types = ['Deposit', 'Withdrawal', 'Charge', 'Income', 'Expense'];
  const typeMap: Record<string, string> = {};
  
  for (const name of types) {
    const t = await prisma.transactionType.upsert({
      where: { name },
      update: {},
      create: { name }
    });
    typeMap[name] = t.id;
  }
  console.log("✅ Transaction types ensured.");

  // 2. Setup Simulation Business & Owner
  const hashedSimulationPassword = await bcrypt.hash("password123", 10);
  
  const business = await prisma.business.upsert({
    where: { id: "simulation-business" },
    update: { type: "CORPORATE" },
    create: {
      id: "simulation-business",
      name: "SimuCorp Solutions",
      type: "CORPORATE",
      address: "123 Simulation Way, Lagos",
      phone: "08012345678"
    }
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
    }
  });

  await prisma.membership.upsert({
    where: { userId_businessId: { userId: owner.id, businessId: business.id } },
    update: { role: "OWNER" },
    create: { userId: owner.id, businessId: business.id, role: "OWNER" }
  });

  // 3. Setup Agents/Members
  const agentEmails = ["agent.john@sim.com", "agent.sarah@sim.com"];
  const agents = [];
  
  for (const email of agentEmails) {
    const name = email.split('@')[0].replace('.', ' ');
    const user = await prisma.user.upsert({
      where: { email },
      update: { password: hashedSimulationPassword },
      create: {
        email,
        name,
        password: hashedSimulationPassword,
        role: "AGENT",
        emailVerified: new Date(),
      }
    });

    await prisma.membership.upsert({
      where: { userId_businessId: { userId: user.id, businessId: business.id } },
      update: { role: "AGENT" },
      create: { userId: user.id, businessId: business.id, role: "AGENT" }
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
        holderId: user.id
      }
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
          typeId: typeMap['Income'],
          paymentMethod: "CASH",
          recordedById: owner.id,
          businessId: business.id,
          date: new Date(monthDate.getTime() + j * 86400000),
          status: "CONFIRMED",
          description: `Monthly Service Fee ${j+1}`
        }
      });
    }

    // Expense Transactions
    for (let j = 0; j < 3; j++) {
      await prisma.transaction.create({
        data: {
          amount: 1000 + Math.random() * 3000,
          typeId: typeMap['Expense'],
          paymentMethod: "BANK_TRANSFER",
          recordedById: owner.id,
          businessId: business.id,
          date: new Date(monthDate.getTime() + j * 126400000),
          status: "CONFIRMED",
          description: `Office Utility ${j+1}`
        }
      });
    }
  }
  console.log("✅ Transaction history populated.");

  // 5. Create active Requests
  await prisma.request.create({
    data: {
      amount: 15000,
      type: "CASH_ADVANCE",
      status: "PENDING",
      description: "Float for tomorrow's field work",
      requesterId: agents[0].id,
      businessId: business.id
    }
  });

  await prisma.request.create({
    data: {
      amount: 2500,
      type: "EXPENSE_REIMBURSEMENT",
      status: "PENDING",
      description: "Fuel for generator",
      requesterId: agents[1].id,
      businessId: business.id
    }
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
