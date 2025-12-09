import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prismaInstance: PrismaClient;

// Accept a few possible env var names to be friendlier with Vercel prefixes
const connectionString =
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.PRISMA_DATABASE_URL ||
  process.env.DATABASE_URL ||
  process.env.STORAGE_PRISMA_URL ||
  process.env.STORAGE_URL;

if (process.env.NODE_ENV === "production") {
  // Para produção (Vercel), use pooling
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  prismaInstance = new PrismaClient({ adapter, log: ["error"] });
} else {
  // Para desenvolvimento local
  if (!globalForPrisma.prisma) {
    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    globalForPrisma.prisma = new PrismaClient({ adapter, log: ["query", "error"] });
  }
  prismaInstance = globalForPrisma.prisma;
}

export const prisma = prismaInstance;
