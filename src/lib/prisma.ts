import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaClientWithAdapter = new (options: { adapter: any }) => PrismaClient;

function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), "dev.db")}`;
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  const adapter = new PrismaLibSql({ url, ...(authToken ? { authToken } : {}) });
  return new (PrismaClient as unknown as PrismaClientWithAdapter)({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
