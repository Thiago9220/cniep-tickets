// Prisma configuration for monorepo structure
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "packages/database/schema.prisma",
  migrations: {
    path: "packages/database/migrations",
  },
  datasource: {
    // Torna opcional durante o build – o Prisma Client não precisa da URL
    // para gerar tipos. No runtime (funções serverless) a URL deve existir.
    url: env("POSTGRES_PRISMA_URL", { optional: true }),
  },
});
