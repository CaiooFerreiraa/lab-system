import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    console.log("Running granular SLA migration (embedded SQL)...");

    await sql`
      CREATE TABLE IF NOT EXISTS "lab_system"."config_prazo" (
          "id" SERIAL PRIMARY KEY,
          "fk_cod_setor" INTEGER NOT NULL REFERENCES "lab_system"."setor"("id") ON DELETE CASCADE,
          "material_tipo" "lab_system"."type_material" NOT NULL,
          "dias_sla" INTEGER NOT NULL DEFAULT 4,
          UNIQUE("fk_cod_setor", "material_tipo")
      );
    `;

    await sql`
      INSERT INTO "lab_system"."config_prazo" (fk_cod_setor, material_tipo, dias_sla)
      SELECT s.id, t.typ, COALESCE(s.sla_entrega_dias, 4)
      FROM "lab_system"."setor" s
      CROSS JOIN (
          SELECT unnest(enum_range(NULL::"lab_system"."type_material")) as typ
      ) t
      ON CONFLICT DO NOTHING;
    `;

    console.log("Migration finished successfully!");
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    process.exit(0);
  }
}

main();
