import { defineConfig } from "prisma";

// Vercel automatically provides these env vars when Postgres is connected
const datasourceUrl =
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  "postgresql://placeholder";

const migrationsUrl =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  "postgresql://placeholder";

export default defineConfig({
  datasources: {
    db: {
      url: datasourceUrl,
    },
  },
  migrations: {
    db: {
      url: migrationsUrl,
    },
  },
});
