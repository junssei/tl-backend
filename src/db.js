import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("render.com")
    ? { rejectUnauthorized: false }
    : false,

  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("railway.com")
    ? { rejectUnauthorized: false }
    : false,
});

export default pool;
