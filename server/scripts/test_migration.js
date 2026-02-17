import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    console.log("Attempting to add column to setor...");
    await sql`ALTER TABLE lab_system.setor ADD COLUMN sla_entrega_dias INTEGER DEFAULT 4;`;
    console.log("Success!");
  } catch (err) {
    console.error("FAILED:", err.message);
  } finally {
    process.exit(0);
  }
}

main();
