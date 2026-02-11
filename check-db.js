import db from './server/config/database.js';

async function check() {
  try {
    const result = await db`SELECT current_schema()`;
    console.log("Current schema:", result);

    const tables = await db`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'lab_system'
    `;
    console.log("Tables in lab_system:", tables.map(t => t.table_name));

    const laudoExists = tables.some(t => t.table_name === 'laudo');
    console.log("Does laudo exist?", laudoExists);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    process.exit();
  }
}

check();
