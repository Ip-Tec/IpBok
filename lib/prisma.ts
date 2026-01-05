import { PrismaClient } from "@/src/generated";

// Ensure DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Avoid multiple instances in dev
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient(); // Prisma reads DATABASE_URL automatically

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
