import db from '../config/database.js';

async function run() {
  console.log("🚀 Criando tabela de configurações...");
  try {
    await db`
      CREATE TABLE IF NOT EXISTS lab_system.configuracao (
        id VARCHAR(50) PRIMARY KEY,
        valor JSONB NOT NULL,
        data_atualizacao TIMESTAMP DEFAULT now()
      )
    `;

    // Inserir configuração padrão de SMTP se não existir
    await db`
      INSERT INTO lab_system.configuracao (id, valor)
      VALUES ('smtp_config', '{"host": "smtp.gmail.com", "port": 587, "user": "", "pass": "", "from": "Lab System <noreply@empresa.com>"}')
      ON CONFLICT (id) DO NOTHING
    `;

    console.log("✅ Tabela 'configuracao' preparada!");
  } catch (err) {
    console.error("❌ Erro ao preparar tabela:", err);
  } finally {
    process.exit();
  }
}

run();
