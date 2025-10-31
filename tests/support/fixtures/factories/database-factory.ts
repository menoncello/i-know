import { faker } from '@faker-js/faker';
import { createUser, createUsers, type User } from './auth-factory';

// Database entity types
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  maxConnections: number;
  connectionTimeout: number;
}

export interface Migration {
  id: string;
  name: string;
  version: string;
  executedAt: string;
  checksum: string;
}

export interface TableSchema {
  tableName: string;
  columns: ColumnDefinition[];
  indexes: IndexDefinition[];
  foreignKeys: ForeignKeyDefinition[];
  constraints: ConstraintDefinition[];
}

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  primaryKey: boolean;
  unique: boolean;
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  unique: boolean;
  type: 'btree' | 'hash' | 'gin' | 'gist';
}

export interface ForeignKeyDefinition {
  name: string;
  column: string;
  referencedTable: string;
  referencedColumn: string;
  onDelete: 'CASCADE' | 'SET NULL' | 'RESTRICT';
  onUpdate: 'CASCADE' | 'SET NULL' | 'RESTRICT';
}

export interface ConstraintDefinition {
  name: string;
  type: 'CHECK' | 'UNIQUE' | 'PRIMARY KEY';
  definition: string;
}

// Factory functions
export const createDatabaseConfig = (overrides: Partial<DatabaseConfig> = {}): DatabaseConfig => ({
  host: 'localhost',
  port: 5432,
  database: 'i-know-dev',
  username: 'postgres',
  password: 'postgres',
  ssl: false,
  maxConnections: 20,
  connectionTimeout: 30000,
  ...overrides,
});

export const createProductionDatabaseConfig = (
  overrides: Partial<DatabaseConfig> = {},
): DatabaseConfig =>
  createDatabaseConfig({
    host: faker.internet.domainName(),
    port: 5432,
    database: 'i-know-prod',
    ssl: true,
    maxConnections: 100,
    ...overrides,
  });

export const createMigration = (overrides: Partial<Migration> = {}): Migration => ({
  id: faker.string.uuid(),
  name: `001_create_users_table_${faker.string.alphanumeric(8).toLowerCase()}`,
  version: '1.0.0',
  executedAt: faker.date.recent().toISOString(),
  checksum: faker.string.hexadecimal({ length: 64 }),
  ...overrides,
});

export const createMigrations = (count: number): Migration[] =>
  Array.from({ length: count }, (_, index) =>
    createMigration({
      name:
        String(index + 1).padStart(3, '0') +
        `_create_table_${faker.lorem.word()}_${faker.string.alphanumeric(8).toLowerCase()}`,
      version: '1.0.' + (index + 1),
    }),
  );

export const createUsersTableSchema = (): TableSchema => ({
  tableName: 'users',
  columns: [
    {
      name: 'id',
      type: 'UUID',
      nullable: false,
      primaryKey: true,
      unique: true,
      defaultValue: 'uuid_generate_v7()',
    },
    {
      name: 'email',
      type: 'VARCHAR(255)',
      nullable: false,
      primaryKey: false,
      unique: true,
    },
    {
      name: 'name',
      type: 'VARCHAR(255)',
      nullable: false,
      primaryKey: false,
      unique: false,
    },
    {
      name: 'password_hash',
      type: 'VARCHAR(255)',
      nullable: false,
      primaryKey: false,
      unique: false,
    },
    {
      name: 'role',
      type: 'VARCHAR(50)',
      nullable: false,
      primaryKey: false,
      unique: false,
      defaultValue: "'user'",
    },
    {
      name: 'is_active',
      type: 'BOOLEAN',
      nullable: false,
      primaryKey: false,
      unique: false,
      defaultValue: 'true',
    },
    {
      name: 'email_verified',
      type: 'BOOLEAN',
      nullable: false,
      primaryKey: false,
      unique: false,
      defaultValue: 'false',
    },
    {
      name: 'created_at',
      type: 'TIMESTAMPTZ',
      nullable: false,
      primaryKey: false,
      unique: false,
      defaultValue: 'NOW()',
    },
    {
      name: 'updated_at',
      type: 'TIMESTAMPTZ',
      nullable: false,
      primaryKey: false,
      unique: false,
      defaultValue: 'NOW()',
    },
    {
      name: 'last_login_at',
      type: 'TIMESTAMPTZ',
      nullable: true,
      primaryKey: false,
      unique: false,
    },
  ],
  indexes: [
    {
      name: 'idx_users_email',
      columns: ['email'],
      unique: true,
      type: 'btree',
    },
    {
      name: 'idx_users_role',
      columns: ['role'],
      unique: false,
      type: 'btree',
    },
    {
      name: 'idx_users_is_active',
      columns: ['is_active'],
      unique: false,
      type: 'btree',
    },
    {
      name: 'idx_users_created_at',
      columns: ['created_at'],
      unique: false,
      type: 'btree',
    },
  ],
  foreignKeys: [],
  constraints: [
    {
      name: 'chk_users_role',
      type: 'CHECK',
      definition: "role IN ('user', 'admin', 'moderator')",
    },
    {
      name: 'chk_users_email_format',
      type: 'CHECK',
      definition: "email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'",
    },
  ],
});

export const createUserPreferencesTableSchema = (): TableSchema => ({
  tableName: 'user_preferences',
  columns: [
    {
      name: 'id',
      type: 'UUID',
      nullable: false,
      primaryKey: true,
      unique: true,
      defaultValue: 'uuid_generate_v7()',
    },
    {
      name: 'user_id',
      type: 'UUID',
      nullable: false,
      primaryKey: false,
      unique: true,
    },
    {
      name: 'theme',
      type: 'VARCHAR(20)',
      nullable: false,
      primaryKey: false,
      unique: false,
      defaultValue: "'system'",
    },
    {
      name: 'language',
      type: 'VARCHAR(10)',
      nullable: false,
      primaryKey: false,
      unique: false,
      defaultValue: "'en'",
    },
    {
      name: 'timezone',
      type: 'VARCHAR(50)',
      nullable: false,
      primaryKey: false,
      unique: false,
      defaultValue: "'UTC'",
    },
    {
      name: 'notifications',
      type: 'JSONB',
      nullable: false,
      primaryKey: false,
      unique: false,
      defaultValue: '\'{"email": true, "push": true, "sms": false}\'',
    },
    {
      name: 'privacy',
      type: 'JSONB',
      nullable: false,
      primaryKey: false,
      unique: false,
      defaultValue: '\'{"profileVisibility": "public", "showEmail": false, "showLastSeen": true}\'',
    },
    {
      name: 'custom_settings',
      type: 'JSONB',
      nullable: false,
      primaryKey: false,
      unique: false,
      defaultValue: "'{}'",
    },
    {
      name: 'created_at',
      type: 'TIMESTAMPTZ',
      nullable: false,
      primaryKey: false,
      unique: false,
      defaultValue: 'NOW()',
    },
    {
      name: 'updated_at',
      type: 'TIMESTAMPTZ',
      nullable: false,
      primaryKey: false,
      unique: false,
      defaultValue: 'NOW()',
    },
  ],
  indexes: [
    {
      name: 'idx_user_preferences_user_id',
      columns: ['user_id'],
      unique: true,
      type: 'btree',
    },
  ],
  foreignKeys: [
    {
      name: 'fk_user_preferences_user_id',
      column: 'user_id',
      referencedTable: 'users',
      referencedColumn: 'id',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  ],
  constraints: [
    {
      name: 'chk_theme_values',
      type: 'CHECK',
      definition: "theme IN ('light', 'dark', 'system')",
    },
  ],
});

// Database connection status factory
export const createDatabaseConnectionStatus = (healthy: boolean = true) => ({
  connected: healthy,
  version: healthy ? 'PostgreSQL 18.0' : null,
  responseTime: healthy ? faker.number.int({ min: 1, max: 50 }) : null,
  error: healthy ? null : 'Connection timeout',
  maxConnections: healthy ? faker.number.int({ min: 10, max: 100 }) : 0,
  activeConnections: healthy ? faker.number.int({ min: 1, max: 20 }) : 0,
  idleConnections: healthy ? faker.number.int({ min: 1, max: 50 }) : 0,
});

// Test data generators
export const generateDatabaseSeedData = () => ({
  users: createUsers(10),
  adminUsers: Array.from({ length: 2 }, () => createUser()),
  migrations: createMigrations(5),
  tableSchemas: [createUsersTableSchema(), createUserPreferencesTableSchema()],
});
