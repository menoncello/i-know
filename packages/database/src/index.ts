import postgres from 'postgres';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
}

let sql: postgres.Sql;

/**
 *
 * @param config
 */
export function connectDatabase(config: DatabaseConfig) {
  sql = postgres({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.ssl,
  });

  return sql;
}

/**
 *
 */
export function getDatabase() {
  if (!sql) {
    throw new Error('Database not initialized. Call connectDatabase first.');
  }
  return sql;
}

export type Database = typeof sql;
