import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  let dbUrl = process.env.DATABASE_URL?.trim();
  if (!dbUrl) {
    console.warn("[PRISMA WARNING] DATABASE_URL is not defined in environment variables");
    return new PrismaClient();
  }

  // Remove surrounding single or double quotes if present
  if (
    (dbUrl.startsWith('"') && dbUrl.endsWith('"')) ||
    (dbUrl.startsWith("'") && dbUrl.endsWith("'"))
  ) {
    dbUrl = dbUrl.slice(1, -1).trim();
  }

  // Clean and ensure sslmode=require, schema=public, and connection timeouts
  try {
    const urlObj = new URL(dbUrl);
    if (!urlObj.searchParams.has("schema")) {
      urlObj.searchParams.set("schema", "public");
    }
    if (!urlObj.searchParams.has("sslmode")) {
      urlObj.searchParams.set("sslmode", "require");
    }
    if (!urlObj.searchParams.has("connect_timeout")) {
      urlObj.searchParams.set("connect_timeout", "15");
    }
    if (!urlObj.searchParams.has("connection_limit")) {
      urlObj.searchParams.set("connection_limit", "10");
    }
    if (!urlObj.searchParams.has("pool_timeout")) {
      urlObj.searchParams.set("pool_timeout", "15");
    }
    dbUrl = urlObj.toString();
  } catch {
    if (!dbUrl.includes("schema=")) {
      const sep = dbUrl.includes("?") ? "&" : "?";
      dbUrl = `${dbUrl}${sep}schema=public`;
    }
    if (!dbUrl.includes("sslmode=")) {
      const sep = dbUrl.includes("?") ? "&" : "?";
      dbUrl = `${dbUrl}${sep}sslmode=require&connect_timeout=15&connection_limit=10&pool_timeout=15`;
    }
  }

  return new PrismaClient({
    datasources: {
      db: { url: dbUrl },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
