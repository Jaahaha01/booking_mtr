const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyUpdate() {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (!connectionString) {
        console.error('❌ DATABASE_URL not found in .env.local');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('🔌 Connected to database');

        const sql = fs.readFileSync('update_schema.sql', 'utf8');

        // Split commands
        const commands = sql.split(';').filter(c => c.trim().length > 0);

        for (const command of commands) {
            try {
                await client.query(command);
                console.log('✅ Executed: ' + command.substring(0, 50) + '...');
            } catch (err) {
                // Ignore "column exists" or "table exists" errors
                if (err.code === '42701' || err.code === '42P07') {
                    console.log('⚠️  Skipped (already exists): ' + command.substring(0, 50) + '...');
                } else {
                    console.error('❌ Error executing command:', err.message);
                }
            }
        }

        console.log('🎉 Update completed!');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.end();
    }
}

applyUpdate();
