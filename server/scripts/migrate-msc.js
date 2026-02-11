import db from "../config/database.js";

async function migrate() {
  console.log("Iniciando migração MSC...");
  try {
    // 1. Criar tabela de MSC (O Agrupador)
    await db`
      CREATE TABLE IF NOT EXISTS lab_system.msc (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL UNIQUE,
        descricao TEXT,
        data_criacao TIMESTAMP DEFAULT NOW()
      );
    `;

    // 2. Criar tabela de Detalhes da MSC (As regras de cada teste)
    // Regra pode ser: 'fixed' (45+/-3), 'range' (45-50), 'max' (<150), 'min' (>2.5)
    await db`
      CREATE TABLE IF NOT EXISTS lab_system.msc_especificacao (
        id SERIAL PRIMARY KEY,
        fk_msc_id INTEGER REFERENCES lab_system.msc(id) ON DELETE CASCADE,
        tipo_teste lab_system.tipo_enum NOT NULL,
        regra_tipo VARCHAR(20) DEFAULT 'fixed', 
        v_alvo NUMERIC,
        v_variacao NUMERIC,
        v_min NUMERIC,
        v_max NUMERIC
      );
    `;

    // 3. Vincular Modelo à MSC
    await db`
      ALTER TABLE lab_system.modelo 
      ADD COLUMN IF NOT EXISTS fk_msc_id INTEGER REFERENCES lab_system.msc(id);
    `;

    // 4. Tornar fk_cod_espec opcional na tabela teste (importante para o seu erro!)
    await db`
      ALTER TABLE lab_system.teste 
      ALTER COLUMN fk_cod_espec DROP NOT NULL;
    `;

    console.log("Migração concluída com sucesso!");
    process.exit(0);
  } catch (err) {
    console.error("Erro na migração:", err);
    process.exit(1);
  }
}

migrate();
