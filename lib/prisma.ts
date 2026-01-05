// lib/prisma.ts
import { PrismaClient } from "@/src/generated";

// Ensure DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

// Use a global variable to preserve Prisma Client across hot reloads in development
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : [],
  });

// Only assign the global variable in development to prevent multiple instances in dev mode
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
