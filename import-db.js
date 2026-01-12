// Import database schema and data to Supabase/Vercel Postgres
// Run: node import-db.js

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function importDatabase() {
  // Get DATABASE_URL from environment variable
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found. Please set it in your environment variables.');
    console.log('\n📌 To get DATABASE_URL from Supabase:');
    console.log('1. Go to Supabase Dashboard → Your Project');
    console.log('2. Click "Project Settings" (gear icon)');
    console.log('3. Go to "Database" tab');
    console.log('4. Scroll down to "Connection string" section');
    console.log('5. Select "URI" and copy the connection string');
    console.log('6. Replace [YOUR-PASSWORD] with your actual database password');
    console.log('\n💡 Run command:');
    console.log('   $env:DATABASE_URL="your-supabase-connection-string"; node import-db.js');
    console.log('\n📌 For Vercel Postgres:');
    console.log('1. Go to Vercel Dashboard → Your Project → Storage');
    console.log('2. Click on your Postgres database');
    console.log('3. Go to ".env.local" tab');
    console.log('4. Copy POSTGRES_URL value');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Read SQL file
    const sqlFile = path.join(__dirname, 'postgres_schema_from_mysql.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('\n📝 Importing schema and data...');
    
    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await client.query(statement);
        successCount++;
        
        // Show progress
        if (statement.toLowerCase().includes('create table')) {
          const tableName = statement.match(/create table (\w+)/i)?.[1];
          console.log(`✅ Created table: ${tableName}`);
        } else if (statement.toLowerCase().includes('insert into')) {
          const tableName = statement.match(/insert into (\w+)/i)?.[1];
          console.log(`✅ Inserted data into: ${tableName}`);
        } else if (statement.toLowerCase().includes('alter table')) {
          console.log(`✅ Added constraints`);
        } else if (statement.toLowerCase().includes('create index')) {
          console.log(`✅ Created index`);
        }
      } catch (error) {
        errorCount++;
        // Some errors are expected (e.g., table already exists)
        if (!error.message.includes('already exists')) {
          console.error(`⚠️  Error: ${error.message.split('\n')[0]}`);
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⚠️  Errors: ${errorCount}`);

    // Test the connection
    console.log('\n🧪 Testing database...');
    const result = await client.query('SELECT COUNT(*) FROM users');
    console.log(`✅ Users table: ${result.rows[0].count} records`);
    
    const rooms = await client.query('SELECT COUNT(*) FROM rooms');
    console.log(`✅ Rooms table: ${rooms.rows[0].count} records`);
    
    const bookings = await client.query('SELECT COUNT(*) FROM bookings');
    console.log(`✅ Bookings table: ${bookings.rows[0].count} records`);

    console.log('\n🎉 Database import completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed');
  }
}

importDatabase();
