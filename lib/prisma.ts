// lib/prisma.ts
import { PrismaClient } from "@/src/generated";

// Ensure DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

// Prisma singleton for Next.js hot reloads
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : [],
    // Force binary engine instead of the new "client" engine
    engineType: "binary",
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
