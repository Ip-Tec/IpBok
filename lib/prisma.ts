// lib/prisma.ts
import { PrismaClient } from "@/src/generated";

// Ensure DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

// Singleton to avoid multiple instances in development
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Initialize Prisma Client
export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient({});

// Assign global in development
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
