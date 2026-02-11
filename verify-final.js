import db from './server/config/database.js';

async function check() {
  try {
    const laudo = await db`SELECT * FROM information_schema.tables WHERE table_name = 'laudo' AND table_schema = 'lab_system'`;
    console.log("Laudo table exists:", laudo.length > 0);

    const columns = await db`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'teste' AND table_schema = 'lab_system'
    `;
    console.log("Columns in teste:", columns.map(c => c.column_name));

    const hasLaudoId = columns.some(c => c.column_name === 'fk_laudo_id');
    console.log("Has fk_laudo_id?", hasLaudoId);

  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    process.exit();
  }
}

check();
