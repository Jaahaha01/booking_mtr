import { Pool } from 'pg';

const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Connection pool settings optimized for Vercel
  max: 5, // Reduced from 20 for Vercel serverless
  min: 0, // No persistent connections in serverless
  idleTimeoutMillis: 15000, // Shorter idle timeout
  connectionTimeoutMillis: 20000, // Increased timeout for slow networks
  statement_timeout: 30000,
  query_timeout: 30000,
  application_name: 'booking_app_vercel',
};

// Use connection pool instead of single client
let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    pool = new Pool(dbConfig);
    
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });

    pool.on('connect', () => {
      console.log('✅ Database pool connected');
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
