import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    console.log("Adding data_recebimento to laudo...");
    await sql`ALTER TABLE lab_system.laudo ADD COLUMN IF NOT EXISTS data_recebimento TIMESTAMP;`;

    console.log("Adding data_prazo to laudo...");
    await sql`ALTER TABLE lab_system.laudo ADD COLUMN IF NOT EXISTS data_prazo TIMESTAMP;`;

    console.log("Adding 'Recebido' to status_enum...");
    // We check if it exists first because ADD VALUE cannot run in a multi-statement block or sometimes IF NOT EXISTS isn't supported for enum labels in older PG, but Neon supports it usually.
    // In PG 12+, we can use:
    try {
      await sql`ALTER TYPE lab_system.status_enum ADD VALUE IF NOT EXISTS 'Recebido';`;
    } catch (e) {
      console.log("Note: Could not add 'Recebido' automatically, maybe it already exists or PG version issue:", e.message);
    }

    console.log("Migration complete!");
  } catch (err) {
    console.error("FAILED:", err.message);
  } finally {
    process.exit(0);
  }
}

main();
