import { connectDatabase, runMigrations as runDbMigrations } from '../src/index.js';

/**
 * Legacy migration script using the new migration system
 */
async function runMigrations() {
  try {
    // Parse DATABASE_URL if available, otherwise use individual POSTGRES_* variables
    let config;

    if (process.env.DATABASE_URL) {
      const url = new URL(process.env.DATABASE_URL);
      config = {
        host: url.hostname,
        port: Number.parseInt(url.port) || 5432,
        database: url.pathname.slice(1), // Remove leading slash
        user: url.username,
        password: url.password,
        ssl: false,
      };
    } else {
      config = {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: Number.parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DB || 'i_know_development',
        user: process.env.POSTGRES_USER || 'username',
        password: process.env.POSTGRES_PASSWORD || 'password',
        ssl: false,
      };
    }

    console.log('🔄 Connecting to database...');
    connectDatabase(config);

    console.log('🔄 Running database migrations...');
    console.log('📋 Database config:', {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
    });

    await runDbMigrations();

    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('❌ Error details:', error instanceof Error ? error.stack : 'Unknown error');
    process.exit(1);
  }
}

if (import.meta.main) {
  runMigrations();
}
