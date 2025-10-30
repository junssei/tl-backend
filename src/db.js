import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

const dbUrl = process.env.DATABASE_URL;
const needsSsl = ["render.com", "railway.app", "railway.com"].some((h) =>
  dbUrl.includes(h)
);

const pool = new Pool({
  connectionString: dbUrl,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
});

export default pool;
