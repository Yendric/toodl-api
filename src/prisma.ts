import { expand } from "dotenv-expand";
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "#/generated/prisma/client.js";

// Initialize environment variables with expansion support
expand(config());

const connectionString = process.env.DB_URL;

if (!connectionString) {
  throw new Error("DB_URL is not defined in the environment.");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;
