import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    const migrationPath = path.join(__dirname, "..", "..", "migrations", "20240216_add_sla_tracking.sql");
    const query = fs.readFileSync(migrationPath, "utf8");

    console.log("Running migration...");
    // Split by semicolons if needed, but neon might support multiple statements if they are separated.
    // However, neon(query) usually executes as a single block.
    // For ALTER TYPE ... ADD VALUE, it cannot run inside a transaction or complex block sometimes.

    // Let's try to run it.
    await sql(query);

    console.log("Migration finished successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit(0);
  }
}

main();
