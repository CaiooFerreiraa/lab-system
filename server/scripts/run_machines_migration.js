import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("🚀 Rodando migration de máquinas e tempos...\n");

  try {
    // 1. Tabela de Máquinas
    console.log("  [1/4] Criando tabela lab_system.maquina...");
    await sql`
      CREATE TABLE IF NOT EXISTS lab_system.maquina (
        id serial PRIMARY KEY,
        nome varchar(100) NOT NULL UNIQUE,
        descricao text,
        fk_cod_setor integer REFERENCES lab_system.setor(id) ON DELETE SET NULL,
        status varchar(20) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo', 'Manutenção')),
        data_criacao timestamp DEFAULT now()
      )
    `;
    console.log("  ✅ maquina criada!\n");

    // 2. Tabela de Configuração de Tempos
    console.log("  [2/4] Criando tabela lab_system.maquina_teste_config...");
    await sql`
      CREATE TABLE IF NOT EXISTS lab_system.maquina_teste_config (
        id serial PRIMARY KEY,
        fk_maquina_id integer NOT NULL REFERENCES lab_system.maquina(id) ON DELETE CASCADE,
        fk_tipo_cod_tipo integer NOT NULL REFERENCES lab_system.tipo(cod_tipo) ON DELETE CASCADE,
        tempo_estimado_segundos integer NOT NULL DEFAULT 60,
        CONSTRAINT maquina_tipo_unique UNIQUE (fk_maquina_id, fk_tipo_cod_tipo)
      )
    `;
    console.log("  ✅ maquina_teste_config criada!\n");

    // 3. Tabela de Emails
    console.log("  [3/4] Criando tabela lab_system.email_notificacao...");
    await sql`
      CREATE TABLE IF NOT EXISTS lab_system.email_notificacao (
        id serial PRIMARY KEY,
        email varchar(255) NOT NULL,
        tipo varchar(50) NOT NULL,
        nome_contato varchar(100),
        data_cadastro timestamp DEFAULT now()
      )
    `;
    console.log("  ✅ email_notificacao criada!\n");

    // 4. Adicionar colunas na tabela teste
    console.log("  [4/4] Adicionando colunas fk_maquina_id e tempo_real_segundos em lab_system.teste...");
    await sql`
      ALTER TABLE lab_system.teste
      ADD COLUMN IF NOT EXISTS fk_maquina_id integer REFERENCES lab_system.maquina(id) ON DELETE SET NULL
    `;
    await sql`
      ALTER TABLE lab_system.teste
      ADD COLUMN IF NOT EXISTS tempo_real_segundos integer DEFAULT 0
    `;
    console.log("  ✅ Colunas adicionadas!\n");

    console.log("🎉 Migration concluída com sucesso!");
  } catch (err) {
    console.error("❌ Erro na migration:", err.message);
  } finally {
    process.exit(0);
  }
}

main();
