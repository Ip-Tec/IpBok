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

// Disable adapter for now to resolve connection pool timeouts with TiDB
/*
if (connectionString) {
  console.log(
    "Attempting to connect to database using DATABASE_URL:",
    connectionString,
  );
  const url = new URL(connectionString);
  const dbConfig = {
    host: url.hostname,
    port: parseInt(url.port, 10),
    user: url.username,
    password: url.password,
    database: url.pathname.substring(1), // remove leading '/'
    ssl: {
      rejectUnauthorized: false,
    },
  };
  console.log("Parsed DB config:", {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    database: dbConfig.database,
  });
  // TiDB Cloud / MySQL compatible connection pool settings
  const poolConfig = {
    ...dbConfig,
    connectionLimit: 5, // Limit connections to avoid creating too many on serverless/dev
    idleTimeout: 60, // Close idle connections after 60s
  };
  adapter = new PrismaMariaDb(poolConfig);
} else {
  console.warn(
    "⚠️ DATABASE_URL environment variable is not set. Prisma will not be initialized.",
  );
}
*/

export const prisma =
  global.prisma ||
  // Use native Prisma Client for better stability with TiDB Cloud
  new PrismaClient({
    engineType: "node",
    log: ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
