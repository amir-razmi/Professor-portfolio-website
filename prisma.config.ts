import "dotenv/config";

import { defineConfig, env } from "prisma/config";
console.log("*URL*: " , env('DATABASE_URL'))
export default defineConfig({
  datasource: {
    url: env('DATABASE_URL'),
  },
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
