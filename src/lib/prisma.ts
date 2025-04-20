import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      },
    },
  });
};

const prisma = globalThis.prisma ?? prismaClientSingleton();

// Ensure the prisma instance is reused during hot-reloading in development
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

// Handle connection errors
prisma.$connect()
  .catch((e) => {
    console.error('Failed to connect to database:', e);
  });

export { prisma }; 