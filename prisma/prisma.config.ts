import { defineConfig } from "prisma";

export default defineConfig({
  datasources: {
    db: {
      url: process.env.POSTGRES_PRISMA_URL!,
    },
  },
  migrations: {
    db: {
      url: process.env.POSTGRES_URL_NON_POOLING!,
    },
  },
});
