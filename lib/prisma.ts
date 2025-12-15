import { PrismaClient } from "../src/generated/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import "dotenv/config";
import { URL } from "url";

declare global {
  // allow global `var` declarations

  var prisma: PrismaClient | undefined;
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}
const url = new URL(connectionString);

const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: parseInt(url.port, 10),
  user: url.username,
  password: url.password,
  database: url.pathname.substring(1), // remove leading '/'
});


export const prisma =
  global.prisma ||
  new PrismaClient({
    adapter,
    log: ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
