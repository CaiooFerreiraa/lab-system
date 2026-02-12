import db from '../config/database.js';

async function migrate() {
  console.log("🚀 Adicionando sequencial de código aos laudos...");

  try {
    // 1. Adicionar coluna codigo_laudo
    await db`
      ALTER TABLE lab_system.laudo 
      ADD COLUMN IF NOT EXISTS codigo_laudo VARCHAR(20) UNIQUE;
    `;
    console.log("✅ Coluna 'codigo_laudo' adicionada!");

    // 2. Preencher registros existentes
    const laudos = await db`SELECT id, data_criacao FROM lab_system.laudo WHERE codigo_laudo IS NULL`;

    for (const l of laudos) {
      const year = new Date(l.data_criacao).getFullYear();
      const code = `L-${year}-${String(l.id).padStart(4, '0')}`;
      await db`UPDATE lab_system.laudo SET codigo_laudo = ${code} WHERE id = ${l.id}`;
    }

    console.log(`✅ ${laudos.length} laudos antigos atualizados com código.`);

  } catch (err) {
    console.error("❌ Erro na migração:", err.message);
  } finally {
    process.exit();
  }
}

migrate();
