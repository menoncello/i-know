import postgres from 'postgres';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  max?: number;
  idle_timeout?: number;
  connect_timeout?: number;
}

interface Migration {
  id: string;
  filename: string;
  sql: string;
  executed_at?: Date;
}

let sql: postgres.Sql;
let isInitialized = false;

/**
 * Connect to database with connection pooling
 */
export function connectDatabase(config: DatabaseConfig) {
  sql = postgres({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.ssl,
    max: config.max || 10,
    idle_timeout: config.idle_timeout || 20,
    connect_timeout: config.connect_timeout || 10,
  });

  return sql;
}

/**
 * Get database instance
 */
export function getDatabase() {
  if (!sql) {
    throw new Error('Database not initialized. Call connectDatabase first.');
  }
  return sql;
}

/**
 * Initialize database with migrations
 */
export async function initializeDatabase() {
  if (isInitialized) {
    return;
  }

  const db = getDatabase();

  try {
    // Create migrations table if it doesn't exist
    await db.unsafe(`
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(255) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    isInitialized = true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to initialize database: ${errorMessage}`);
  }
}

/**
 * Run database migrations
 */
export async function runMigrations() {
  await initializeDatabase();
  const db = getDatabase();

  try {
    // Get available migration files
    const migrationsPath = join(fileURLToPath(import.meta.url), 'migrations');
    const migrationFiles = ['001_initial_schema.sql'];

    // Get executed migrations
    const executedMigrations = await db<Migration[]>`
      SELECT id, filename FROM migrations ORDER BY id
    `;
    const executedSet = new Set(executedMigrations.map(m => m.id));

    // Run pending migrations
    for (const filename of migrationFiles) {
      const migrationId = filename.replace('.sql', '');

      if (executedSet.has(migrationId)) {
        continue;
      }

      const migrationPath = join(migrationsPath, filename);
      const migrationSql = readFileSync(migrationPath, 'utf-8');

      await db.begin(async sql => {
        // Execute migration
        await sql.unsafe(migrationSql);

        // Record migration
        await sql`
          INSERT INTO migrations (id, filename)
          VALUES (${migrationId}, ${filename})
        `;
      });

      console.log(`✅ Migration ${filename} executed successfully`);
    }

    console.log('🎉 All migrations completed');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Migration failed: ${errorMessage}`);
  }
}

/**
 * Check database connection health
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const db = getDatabase();
    await db`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Close database connection
 */
export async function closeDatabase() {
  if (sql) {
    await sql.end();
    sql = undefined as any;
    isInitialized = false;
  }
}

export type Database = typeof sql;
