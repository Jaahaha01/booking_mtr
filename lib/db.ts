import { Pool } from 'pg';

const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Connection pool settings
  max: 20, // Maximum number of clients
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

// Use connection pool instead of single client
let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    pool = new Pool(dbConfig);
    
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  return pool;
}

export const db = async (strings: TemplateStringsArray, ...values: any[]) => {
  try {
    const query = strings.reduce((acc, str, i) => acc + '$' + i + str).slice(0, -1);
    const pool = getPool();
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export async function testConnection() {
  try {
    const pool = getPool();
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

export async function closeConnection() {
  try {
    if (pool) {
      await pool.end();
      pool = null;
      console.log('✅ Database connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
}
