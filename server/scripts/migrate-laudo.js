import db from '../config/database.js';

async function migrate() {
  console.log("🚀 Iniciando migração de Laudos (Reports)...");

  try {
    // 1. Criar a tabela de Laudos
    await db(`
      CREATE TABLE IF NOT EXISTS lab_system.laudo (
        id SERIAL PRIMARY KEY,
        fk_funcionario_matricula VARCHAR(50) REFERENCES lab_system.funcionario(matricula),
        fk_modelo_cod_modelo INTEGER REFERENCES lab_system.modelo(cod_modelo),
        fk_material VARCHAR(100),
        fk_cod_setor INTEGER REFERENCES lab_system.setor(id),
        status_geral VARCHAR(20) DEFAULT 'Pendente',
        observacoes TEXT,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Tabela 'laudo' criada!");

    // 2. Adicionar coluna fk_laudo_id na tabela de teste
    await db(`
      ALTER TABLE lab_system.teste 
      ADD COLUMN IF NOT EXISTS fk_laudo_id INTEGER REFERENCES lab_system.laudo(id) ON DELETE CASCADE;
    `);
    console.log("✅ Coluna 'fk_laudo_id' adicionada em 'teste'!");

    // 3. (Opcional) Migrar testes existentes para laudos fictícios ou deixar nulo
    // Por enquanto deixaremos nulo para novos registros seguirem o padrão.

  } catch (err) {
    console.error("❌ Erro na migração:", err);
  } finally {
    process.exit();
  }
}

migrate();
