import db from "./config/database.js";

async function run() {
  try {
    // Adicionar numero_pedido à tabela laudo se não existir
    await db`
      ALTER TABLE lab_system.laudo ADD COLUMN IF NOT EXISTS numero_pedido VARCHAR(50);
    `;
    console.log("✅ Coluna numero_pedido adicionada à tabela laudo.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Erro ao adicionar coluna:", err);
    process.exit(1);
  }
}

run();
