import db from '../config/database.js';

async function migrate() {
  console.log("🚀 Iniciando migração de Balanças...");

  try {
    await db`
      CREATE TABLE IF NOT EXISTS lab_system.balanca (
        id SERIAL PRIMARY KEY,
        patrimonio VARCHAR(50) NOT NULL UNIQUE,
        calibracao_externa BOOLEAN DEFAULT false,
        fk_cod_setor INTEGER REFERENCES lab_system.setor(id),
        status VARCHAR(20) CHECK (status IN ('Aprovado', 'Reprovado')),
        diferenca_reprovacao NUMERIC,
        observacoes TEXT,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log("✅ Tabela 'balanca' criada com sucesso!");
  } catch (err) {
    console.error("❌ Erro na migração:", err);
  } finally {
    process.exit();
  }
}

migrate();
