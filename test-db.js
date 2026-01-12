import { testConnection } from './lib/db';

async function test() {
  console.log('Testing database connection...');
  const result = await testConnection();
  if (result) {
    console.log('✅ Database connected successfully!');
  } else {
    console.log('❌ Database connection failed!');
  }
  process.exit(0);
}

test();