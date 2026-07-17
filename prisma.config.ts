import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7: URL datasource untuk Migrate/CLI ada di sini (bukan di schema.prisma).
export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
