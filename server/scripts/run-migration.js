import db from "../config/database.js";

async function run() {
  try {
    console.log("Executando ALTER TABLE...");
    await db`ALTER TABLE "lab_system"."setor" ADD COLUMN IF NOT EXISTS "config_perfil" VARCHAR(50) DEFAULT 'padrao'`;

    console.log("Atualizando perfis...");
    await db`UPDATE "lab_system"."setor" SET "config_perfil" = 'laboratório' WHERE LOWER(nome) = 'laboratório'`;
    await db`UPDATE "lab_system"."setor" SET "config_perfil" = 'borracha' WHERE LOWER(nome) = 'borracha'`;
    await db`UPDATE "lab_system"."setor" SET "config_perfil" = 'injetado' WHERE LOWER(nome) = 'injetado'`;
    await db`UPDATE "lab_system"."setor" SET "config_perfil" = 'protótipo' WHERE LOWER(nome) = 'protótipo'`;
    await db`UPDATE "lab_system"."setor" SET "config_perfil" = 'almoxarifado' WHERE LOWER(nome) = 'almoxarifado'`;
    await db`UPDATE "lab_system"."setor" SET "config_perfil" = 'pré-fabricado' WHERE LOWER(nome) = 'pré-fabricado'`;
    await db`UPDATE "lab_system"."setor" SET "config_perfil" = 'químico' WHERE LOWER(nome) = 'químico'`;

    console.log("Migração 006 concluída!");
    process.exit(0);
  } catch (error) {
    console.error("Erro na migração:", error);
    process.exit(1);
  }
}

run();
