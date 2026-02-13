import db from "../config/database.js";

async function test() {
  try {
    const res = await db`SELECT 1 as connected`;
    console.log("Conectado:", res);
    process.exit(0);
  } catch (err) {
    console.error("Erro:", err);
    process.exit(1);
  }
}

test();
