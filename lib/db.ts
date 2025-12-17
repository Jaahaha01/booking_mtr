import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:./booking.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export { db };
