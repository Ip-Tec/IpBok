import { PrismaClient } from "@/src/generated/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    engineType: "node",
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
