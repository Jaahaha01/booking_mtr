import { Client } from 'pg';

const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Single connection settings
  connectionTimeoutMillis: 30000, // 30 seconds
  query_timeout: 30000,
};

export const client = new Client(dbConfig);

// Connect once
client.connect().catch(console.error);

export const db = async (strings: TemplateStringsArray, ...values: any[]) => {
  try {
    const query = strings.reduce((acc, str, i) => acc + '$' + i + str).slice(0, -1);
    const result = await client.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export async function testConnection() {
  try {
    await client.query('SELECT 1');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

export async function closeConnection() {
  try {
    await client.end();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
}
