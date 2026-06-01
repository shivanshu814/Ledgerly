import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  // For Neon serverless: connection_limit=1 prevents pool exhaustion,
  // connect_timeout=10 allows retries on cold starts,
  // pool_timeout=0 disables pool wait timeouts.
  const url = process.env.DATABASE_URL ?? "";
  const separator = url.includes("?") ? "&" : "?";
  const datasourceUrl = url.includes("connection_limit")
    ? url
    : `${url}${separator}connection_limit=1&connect_timeout=10&pool_timeout=0`;

  return new PrismaClient({
    datasources: { db: { url: datasourceUrl } },
    log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
  });
}

export const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
