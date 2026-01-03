import { PrismaClient } from '../src/generated/client';

// @ts-ignore
const prisma = new PrismaClient({ accelerateUrl: process.env.DATABASE_URL || "" });

async function resetBusinessType() {
  console.log("Looking for recent business to reset...");
  
  const business = await prisma.business.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  if (!business) {
    console.log("No business found.");
    return;
  }

  console.log(`Found Business: ${business.name} (ID: ${business.id}) (Current Type: ${business.type})`);

  // Force update type to null. Note: TS might complain if generated types say it's not nullable yet, 
  // but we know we updated schema. If types aren't regenerated yet, we might need 'as any'.
  await prisma.business.update({
    where: { id: business.id },
    data: { type: null } as any
  });

  console.log("✅ Business type reset to NULL.");
}

resetBusinessType()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
