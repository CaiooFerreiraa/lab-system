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
    const migrationPath = path.join(__dirname, "..", "..", "migrations", "20240216_add_granular_sla.sql");
    const query = fs.readFileSync(migrationPath, "utf8");

    if (!query.trim()) {
      console.log("Empty migration file.");
      return;
    }

    console.log("Running granular SLA migration...");
    // For dynamic strings in Neon, we wrap it in an array to treat it as a template with no variables
    await sql([query]);
    console.log("Migration finished successfully!");
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    process.exit(0);
  }
}

main();
