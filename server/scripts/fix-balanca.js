import db from '../config/database.js';

async function fix() {
  console.log("🛠️ Corrigindo tabela balanca...");
  try {
    // Tenta adicionar a coluna observacoes se não existir
    await db`
      ALTER TABLE lab_system.balanca 
      ADD COLUMN IF NOT EXISTS observacoes TEXT
    `;
    console.log("✅ Coluna 'observacoes' adicionada com sucesso!");
  } catch (err) {
    console.error("❌ Erro ao corrigir tabela balanca:", err);
  } finally {
    process.exit();
  }
}

fix();
