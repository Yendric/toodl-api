import { config } from "dotenv";
import { expand } from "dotenv-expand";
import "dotenv/config";
import { defineConfig } from "prisma/config";

expand(config());

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DB_URL ?? "",
  },
});
