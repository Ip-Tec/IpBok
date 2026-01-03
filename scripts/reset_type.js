const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../src/generated'));
const prisma = new PrismaClient();

async function resetBusinessType() {
  console.log("Looking for recent business to reset...");
  // Find the most recently created business
  const business = await prisma.business.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  if (!business) {
    console.log("No business found.");
    return;
  }

  console.log(`Found Business: ${business.name} (ID: ${business.id}) (Current Type: ${business.type})`);

  await prisma.business.update({
    where: { id: business.id },
    data: { type: null }
  });

  console.log("✅ Business type reset to NULL.");
}

resetBusinessType().catch(e => console.error(e)).finally(() => prisma.$disconnect());
