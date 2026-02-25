import db from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const sqlPath = path.join(__dirname, '../../migrations/20240217_add_machines_and_timing.sql');
  console.log(`🚀 Executando migração: ${sqlPath}`);

  try {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await db.unsafe(sql);
    console.log("✅ Migração de máquinas e tempos concluída com sucesso!");
  } catch (err) {
    console.error("❌ Erro na migração:", err);
  } finally {
    process.exit();
  }
}

run();
