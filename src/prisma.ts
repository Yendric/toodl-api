import { PrismaClient } from "#/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import { expand } from "dotenv-expand";
import pg from "pg";

// Initialize environment variables with expansion support
expand(config());

const connectionString = process.env.DB_URL;

if (!connectionString) {
  console.warn("DB_URL is not defined in the environment.");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;
