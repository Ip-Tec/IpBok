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
// lib/prisma.ts
import { PrismaClient } from "@/src/generated";

// Ensure DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

// Use a global variable to prevent multiple instances in dev (Next.js hot reload)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Initialize Prisma
export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient({});

// Only assign the global variable in development
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
