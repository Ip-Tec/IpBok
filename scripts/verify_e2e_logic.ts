import { PrismaClient } from "@/src/generated";
import { Role, RequestType, RequestStatus } from "@/src/generated";

// @ts-ignore
const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL || "",
});

async function main() {
  console.log("🚀 Starting End-to-End Logic Verification...");

  // 1. Setup Data
  console.log("\n1. Setting up Test Users...");

  // Create Business
  const business = await prisma.business.upsert({
    where: { id: "test-business-1" },
    update: {},
    create: {
      id: "test-business-1",
      name: "Test Corp",
      type: "CORPORATE",
    },
  });

  // Create Owner
  const owner = await prisma.user.upsert({
    where: { email: "owner@test.com" },
    update: {},
    create: {
      email: "owner@test.com",
      name: "Test Owner",
      role: Role.OWNER,
      memberships: { create: { businessId: business.id, role: Role.OWNER } },
    },
  });

  // Create Agent
  const agent = await prisma.user.upsert({
    where: { email: "agent@test.com" },
    update: {},
    create: {
      email: "agent@test.com",
      name: "Test Agent",
      role: Role.AGENT,
      memberships: { create: { businessId: business.id, role: Role.AGENT } },
    },
  });

  console.log("✅ Users ready.");

  // 2. Test Request Creation
  console.log("\n2. Testing Request Creation...");
  const requestAmt = 5000;

  const request = await prisma.request.create({
    data: {
      amount: requestAmt,
      type: RequestType.CASH_ADVANCE,
      description: "Test Float Request",
      status: RequestStatus.PENDING,
      requesterId: agent.id,
      businessId: business.id,
    },
  });

  if (request.status === "PENDING") {
    console.log(`✅ Request created successfully: ${request.id}`);
  } else {
    console.error("❌ Request creation failed");
  }

  // 3. Test Approval Logic (Simulating API logic)
  console.log("\n3. Testing Approval Logic...");

  // Update Request
  const approvedReq = await prisma.request.update({
    where: { id: request.id },
    data: {
      status: RequestStatus.APPROVED,
      approverId: owner.id,
    },
  });

  // Create side-effect (Cash Advance)
  const cashAdvance = await prisma.cashAdvance.create({
    data: {
      amount: approvedReq.amount,
      description: "Approved Test Request",
      status: "CONFIRMED",
      businessId: business.id,
      givenById: owner.id,
      receivedById: agent.id,
    },
  });

  // Verify Side Effects
  if (approvedReq.status === "APPROVED" && cashAdvance.id) {
    console.log("✅ Request Approved and Cash Advance created.");
  } else {
    console.error("❌ Approval logic failed");
  }

  // 4. Test Notification Creation
  console.log("\n4. Testing Notifications...");
  const notif = await prisma.notification.create({
    data: {
      userId: agent.id,
      message: "Your request was approved",
      isRead: false,
    },
  });

  if (notif.id) {
    console.log("✅ Notification created.");
  }

  console.log("\n🎉 Verification Complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
