import { PrismaClient } from "../src/generated/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import "dotenv/config";
import { URL } from "url";

declare global {
  // allow global `var` declarations

  var prisma: PrismaClient | undefined;
}

const connectionString = process.env.DATABASE_URL;
let adapter: any;

if (connectionString) {
  const url = new URL(connectionString);
  adapter = new PrismaMariaDb({
    host: url.hostname,
    port: parseInt(url.port, 10),
    user: url.username,
    password: url.password,
    database: url.pathname.substring(1), // remove leading '/'
    ssl: {
      rejectUnauthorized: true,
    },
  });
} else {
  console.warn("⚠️ DATABASE_URL environment variable is not set. Prisma will not be initialized.");
}


export const prisma =
  global.prisma ||
  // @ts-ignore - Broken generated types require adapter even when using accelerateUrl
  new PrismaClient({
    log: ["query", "info", "warn", "error"],
    ...(adapter 
      ? { adapter } 
      : { 
          accelerateUrl: process.env.DATABASE_URL || "" 
        }
    ),
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
