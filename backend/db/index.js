const { createClient } = require('@libsql/client');
const { drizzle } = require('drizzle-orm/libsql');
const schema = require('./schema');

let db;

function initializeDatabase(url, authToken) {
  const client = createClient({
    url: url || process.env.TURSO_DATABASE_URL,
    authToken: authToken || process.env.TURSO_AUTH_TOKEN,
  });
  db = drizzle(client, { schema });
  return db;
}

function getDb() {
  if (!db) {
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    db = drizzle(client, { schema });
  }
  return db;
}

module.exports = { initializeDatabase, getDb, schema };
