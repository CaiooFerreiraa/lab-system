import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const connectString = process.env.DATABASE_URL;

if (!connectString) {
  throw new Error("DATABASE_URL não está definida nas variáveis de ambiente.");
}

const db = neon(connectString);

export default db;
