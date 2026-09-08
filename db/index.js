import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const isProduction = process.env.NODE_ENV === 'production';
const hasSslMode = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require');

let pool = null;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction || hasSslMode ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 3000,
    });
  } catch (err) {
    console.warn('Could not initialize PostgreSQL pool:', err.message);
  }
}

// Resilient memory store for instant zero-config deployments
const memoryStore = new Map();

const db = {
  async query(text, params = []) {
    if (pool) {
      try {
        return await pool.query(text, params);
      } catch (err) {
        console.warn('PostgreSQL query error, using fallback store:', err.message);
      }
    }

    // In-memory fallback queries:
    // 1. Check alias existence
    if (text.includes('SELECT id FROM urls WHERE short_code = $1')) {
      const code = params[0];
      const item = memoryStore.get(code);
      return { rows: item ? [{ id: item.id }] : [] };
    }

    // 2. Insert new shortened URL
    if (text.includes('INSERT INTO urls')) {
      const [short_code, long_url, expires_at] = params;
      const row = {
        id: memoryStore.size + 1,
        short_code,
        long_url,
        expires_at: expires_at || null,
        created_at: new Date().toISOString(),
        clicks: 0,
      };
      memoryStore.set(short_code, row);
      return { rows: [row] };
    }

    // 3. Find URL by short_code
    if (text.includes('SELECT * FROM urls WHERE short_code = $1')) {
      const code = params[0];
      const item = memoryStore.get(code);
      return { rows: item ? [item] : [] };
    }

    // 4. Increment click counter
    if (text.includes('UPDATE urls SET clicks = clicks + 1')) {
      const code = params[0];
      const item = memoryStore.get(code);
      if (item) {
        item.clicks = (item.clicks || 0) + 1;
      }
      return { rowCount: item ? 1 : 0 };
    }

    return { rows: [] };
  },
};

export default db;