import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const sql = neon(process.env.DATABASE_URL);

async function main() {
  const steps = [
    { name: "Add sla_entrega_dias to setor", query: `ALTER TABLE "lab_system"."setor" ADD COLUMN IF NOT EXISTS "sla_entrega_dias" INTEGER DEFAULT 4;` },
    { name: "Add data_recebimento to laudo", query: `ALTER TABLE "lab_system"."laudo" ADD COLUMN IF NOT EXISTS "data_recebimento" TIMESTAMP;` },
    { name: "Add data_prazo to laudo", query: `ALTER TABLE "lab_system"."laudo" ADD COLUMN IF NOT EXISTS "data_prazo" TIMESTAMP;` },
    { name: "Check Recebido in status_enum", query: `SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'status_enum' AND e.enumlabel = 'Recebido';` }
  ];

  for (const step of steps) {
    console.log(`Executing: ${step.name}...`);
    try {
      const result = await sql(step.query);
      if (step.name === "Check Recebido in status_enum" && result.length === 0) {
        console.log("Adding 'Recebido' to status_enum...");
        // ALTER TYPE ADD VALUE cannot be executed in a transaction block.
        // If neon wraps this, it might fail.
        await sql(`ALTER TYPE "lab_system"."status_enum" ADD VALUE 'Recebido';`);
      }
      console.log("Success!");
    } catch (err) {
      console.error(`Error in step ${step.name}:`, err.message);
    }
  }
  process.exit(0);
}

main();
