import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && dbUrl.startsWith("postgres") && !dbUrl.includes("sslmode=")) {
    const separator = dbUrl.includes("?") ? "&" : "?";
    return new PrismaClient({
      datasources: {
        db: { url: `${dbUrl}${separator}sslmode=require` },
      },
    });
  }
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
