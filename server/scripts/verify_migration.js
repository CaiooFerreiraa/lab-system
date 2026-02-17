import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    const setorCols = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'lab_system' AND table_name = 'setor' AND column_name = 'sla_entrega_dias'
    `;
    console.log('Setor has sla_entrega_dias:', setorCols.length > 0);

    const laudoCols = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'lab_system' AND table_name = 'laudo' AND column_name IN ('data_recebimento', 'data_prazo')
    `;
    console.log('Laudo has columns:', laudoCols.map(c => c.column_name));

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
