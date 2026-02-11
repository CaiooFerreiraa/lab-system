import db from './server/config/database.js';

async function run() {
  try {
    console.log("Creating table...");
    await db`
      CREATE TABLE IF NOT EXISTS lab_system.laudo (
        id SERIAL PRIMARY KEY,
        fk_funcionario_matricula VARCHAR(50) REFERENCES lab_system.funcionario(matricula),
        fk_modelo_cod_modelo INTEGER REFERENCES lab_system.modelo(cod_modelo),
        fk_material VARCHAR(100),
        fk_cod_setor INTEGER REFERENCES lab_system.setor(id),
        status_geral VARCHAR(20) DEFAULT 'Pendente',
        observacoes TEXT,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log("Table created.");

    console.log("Altering test table...");
    await db`
      ALTER TABLE lab_system.teste 
      ADD COLUMN IF NOT EXISTS fk_laudo_id INTEGER REFERENCES lab_system.laudo(id) ON DELETE CASCADE
    `;
    console.log("Table altered.");
  } catch (err) {
    console.error("MIGRATION ERROR DETAILS:", err.message);
    console.error(err);
  } finally {
    process.exit();
  }
}

run();
