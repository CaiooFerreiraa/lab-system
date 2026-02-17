import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const sql = neon(process.env.DATABASE_URL);

async function main() {
  try {
    const res = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'lab_system' AND table_name = 'config_prazo'`;
    console.log("Table config_prazo exists:", res.length > 0);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
