import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    const sectors = await sql`SELECT * FROM lab_system.setor`;
    console.log('--- SECTORS ---');
    console.log(JSON.stringify(sectors, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
