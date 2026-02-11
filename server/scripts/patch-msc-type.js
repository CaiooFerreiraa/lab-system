import db from "../config/database.js";

async function patch() {
  try {
    await db`ALTER TABLE lab_system.msc ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'DN';`;
    console.log("Coluna 'tipo' adicionada na tabela MSC.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
patch();
