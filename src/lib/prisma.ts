import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://domora:domora_dev_password@localhost:5432/domora_ai?schema=public";

const pool =
  globalForPrisma.pgPool ??
  new Pool({
    connectionString,
    max: process.env.PG_POOL_MAX
      ? Number(process.env.PG_POOL_MAX)
      : connectionString.includes("127.0.0.1")
        ? 1
        : 10,
  });

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pgPool = pool;
  globalForPrisma.prisma = prisma;
}
