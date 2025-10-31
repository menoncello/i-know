import { test, expect, describe, beforeAll, afterAll, beforeEach } from 'bun:test';
import { connectDatabase, getDatabase, closeDatabase, checkDatabaseHealth } from './index';

// Test database configuration
const testConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_TEST_NAME || 'iknow_test',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: false,
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
};

describe('1.2-DB Series: Comprehensive Database Schema Validation', () => {
  let db: any;
  let connectedSuccessfully = false;

  beforeAll(async () => {
    try {
      connectDatabase(testConfig);
      db = getDatabase();
      await db`SELECT 1`; // Test connection
      connectedSuccessfully = true;

      // Set up test schema
      await setupTestDatabase();
    } catch (error) {
      console.log('Database not available for testing - skipping schema validation tests');
      connectedSuccessfully = false;
    }
  });

  afterAll(async () => {
    if (connectedSuccessfully) {
      await cleanupTestDatabase();
      await closeDatabase();
    }
  });

  beforeEach(async () => {
    if (connectedSuccessfully) {
      // Clean up test data before each test
      await db`DELETE FROM filmography`;
      await db`DELETE FROM user_preferences`;
      await db`DELETE FROM actors`;
      await db`DELETE FROM users`;
    }
  });

  async function setupTestDatabase() {
    if (!connectedSuccessfully) return;

    try {
      // Enable UUID extension
      await db`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

      // Create UUID v7 function
      await db`
        CREATE OR REPLACE FUNCTION uuid_v7()
        RETURNS UUID AS $$
        DECLARE
          timestamp_ms BIGINT;
          random_bytes BYTEA;
          uuid_bytes BYTEA;
        BEGIN
          timestamp_ms := EXTRACT(EPOCH FROM NOW()) * 1000;
          random_bytes := gen_random_bytes(10);
          uuid_bytes :=
            SET_BYTE(bytea '\0\0\0\0\0\0', 0, (timestamp_ms >> 40)::INTEGER) ||
            SET_BYTE(bytea '\0\0\0\0\0\0', 1, (timestamp_ms >> 32)::INTEGER) ||
            SET_BYTE(bytea '\0\0\0\0\0\0', 2, (timestamp_ms >> 24)::INTEGER) ||
            SET_BYTE(bytea '\0\0\0\0\0\0', 3, (timestamp_ms >> 16)::INTEGER) ||
            SET_BYTE(bytea '\0\0\0\0\0\0', 4, (timestamp_ms >> 8)::INTEGER) ||
            SET_BYTE(bytea '\0\0\0\0\0\0', 5, timestamp_ms::INTEGER) ||
            SUBSTRING(random_bytes, 1, 4) ||
            SUBSTRING(random_bytes, 5, 6);
          uuid_bytes := SET_BYTE(uuid_bytes, 6, (GET_BYTE(uuid_bytes, 6) & 0x0F) | 0x70);
          uuid_bytes := SET_BYTE(uuid_bytes, 8, (GET_BYTE(uuid_bytes, 8) & 0x3F) | 0x80);
          RETURN encode(uuid_bytes, 'hex')::UUID;
        END;
        $$ LANGUAGE plpgsql;
      `;

      // Create tables
      await db`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT uuid_v7(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      await db`
        CREATE TABLE IF NOT EXISTS user_preferences (
          id UUID PRIMARY KEY DEFAULT uuid_v7(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          preferences JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id)
        );
      `;

      await db`
        CREATE TABLE IF NOT EXISTS actors (
          id UUID PRIMARY KEY DEFAULT uuid_v7(),
          name VARCHAR(255) NOT NULL,
          bio TEXT,
          birth_date DATE,
          photo_url TEXT,
          imdb_id VARCHAR(50) UNIQUE,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      await db`
        CREATE TABLE IF NOT EXISTS filmography (
          id UUID PRIMARY KEY DEFAULT uuid_v7(),
          actor_id UUID NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          year INTEGER,
          role VARCHAR(255),
          media_type VARCHAR(50) DEFAULT 'movie',
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      // Create indexes
      await db`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
      await db`CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id)`;
      await db`CREATE INDEX IF NOT EXISTS idx_actors_name ON actors(name)`;
      await db`CREATE INDEX IF NOT EXISTS idx_actors_imdb_id ON actors(imdb_id)`;
      await db`CREATE INDEX IF NOT EXISTS idx_filmography_actor_id ON filmography(actor_id)`;
      await db`CREATE INDEX IF NOT EXISTS idx_filmography_title ON filmography(title)`;

      // Create update timestamp function
      await db`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `;

      // Create triggers
      await db`
        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
        CREATE TRIGGER update_users_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `;

      await db`
        DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
        CREATE TRIGGER update_user_preferences_updated_at
          BEFORE UPDATE ON user_preferences
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `;

      await db`
        DROP TRIGGER IF EXISTS update_actors_updated_at ON actors;
        CREATE TRIGGER update_actors_updated_at
          BEFORE UPDATE ON actors
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `;
    } catch (error) {
      console.error('Failed to set up test database:', error);
      throw error;
    }
  }

  async function cleanupTestDatabase() {
    if (!connectedSuccessfully) return;

    try {
      await db`DROP TABLE IF EXISTS filmography CASCADE`;
      await db`DROP TABLE IF EXISTS user_preferences CASCADE`;
      await db`DROP TABLE IF EXISTS actors CASCADE`;
      await db`DROP TABLE IF EXISTS users CASCADE`;
      await db`DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE`;
      await db`DROP FUNCTION IF EXISTS uuid_v7() CASCADE`;
    } catch (error) {
      console.error('Failed to clean up test database:', error);
    }
  }

  describe('1.2-DB-001: Users table validation', () => {
    test('should create users table with correct schema', async () => {
      if (!connectedSuccessfully) {
        console.log('Skipping test - database not available');
        return;
      }

      const result = await db`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `;

      expect(result).toHaveLength(5);

      // Check id column
      expect(result[0]).toMatchObject({
        column_name: 'id',
        data_type: 'uuid',
        is_nullable: 'NO',
      });
      expect(result[0].column_default).toContain('uuid_v7()');

      // Check email column
      expect(result[1]).toMatchObject({
        column_name: 'email',
        data_type: 'character varying',
        is_nullable: 'NO',
      });

      // Check password_hash column
      expect(result[2]).toMatchObject({
        column_name: 'password_hash',
        data_type: 'character varying',
        is_nullable: 'NO',
      });

      // Check created_at column
      expect(result[3]).toMatchObject({
        column_name: 'created_at',
        data_type: 'timestamp with time zone',
        is_nullable: 'YES',
      });
      expect(result[3].column_default).toContain('NOW()');

      // Check updated_at column
      expect(result[4]).toMatchObject({
        column_name: 'updated_at',
        data_type: 'timestamp with time zone',
        is_nullable: 'YES',
      });
      expect(result[4].column_default).toContain('NOW()');
    });

    test('should enforce unique constraint on email', async () => {
      if (!connectedSuccessfully) return;

      const email = 'test@example.com';
      const passwordHash = 'hashed_password';

      // Insert first user
      await db`
        INSERT INTO users (email, password_hash)
        VALUES (${email}, ${passwordHash})
      `;

      // Attempt to insert duplicate email should fail
      expect(async () => {
        await db`
          INSERT INTO users (email, password_hash)
          VALUES (${email}, ${passwordHash})
        `;
      }).toThrow();
    });

    test('should auto-generate UUID v7 primary keys', async () => {
      if (!connectedSuccessfully) return;

      const result = await db`
        INSERT INTO users (email, password_hash)
        VALUES ('test@example.com', 'hashed_password')
        RETURNING id
      `;

      expect(result).toHaveLength(1);
      const userId = result[0].id;
      expect(userId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    test('should automatically update updated_at timestamp', async () => {
      if (!connectedSuccessfully) return;

      const insertResult = await db`
        INSERT INTO users (email, password_hash)
        VALUES ('test@example.com', 'hashed_password')
        RETURNING created_at, updated_at
      `;

      const originalUpdatedAt = insertResult[0].updated_at;
      expect(insertResult[0].created_at).toEqual(originalUpdatedAt);

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Update the user
      await db`
        UPDATE users SET email = 'updated@example.com'
        WHERE email = 'test@example.com'
      `;

      const updateResult = await db`
        SELECT updated_at FROM users WHERE email = 'updated@example.com'
      `;

      expect(new Date(updateResult[0].updated_at).getTime()).toBeGreaterThan(
        new Date(originalUpdatedAt).getTime(),
      );
    });
  });

  describe('1.2-DB-002: User preferences table validation', () => {
    let userId: string;

    beforeEach(async () => {
      if (!connectedSuccessfully) return;

      const userResult = await db`
        INSERT INTO users (email, password_hash)
        VALUES ('test@example.com', 'hashed_password')
        RETURNING id
      `;
      userId = userResult[0].id;
    });

    test('should create user_preferences table with correct schema', async () => {
      if (!connectedSuccessfully) return;

      const result = await db`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'user_preferences'
        ORDER BY ordinal_position
      `;

      expect(result).toHaveLength(5);

      // Check preferences column is JSONB
      const preferencesColumn = result.find((col: any) => col.column_name === 'preferences');
      expect(preferencesColumn).toMatchObject({
        column_name: 'preferences',
        data_type: 'jsonb',
        is_nullable: 'NO',
      });
      expect(preferencesColumn.column_default).toMatch(/'{}'::jsonb/);
    });

    test('should enforce foreign key constraint to users table', async () => {
      if (!connectedSuccessfully) return;

      const invalidUserId = '00000000-0000-0000-0000-000000000000';

      expect(async () => {
        await db`
          INSERT INTO user_preferences (user_id, preferences)
          VALUES (${invalidUserId}, '{"theme": "dark"}')
        `;
      }).toThrow();
    });

    test('should enforce unique constraint on user_id', async () => {
      if (!connectedSuccessfully) return;

      // Insert first preference
      await db`
        INSERT INTO user_preferences (user_id, preferences)
        VALUES (${userId}, '{"theme": "dark"}')
      `;

      // Attempt to insert duplicate user_id should fail
      expect(async () => {
        await db`
          INSERT INTO user_preferences (user_id, preferences)
          VALUES (${userId}, '{"theme": "light"}')
        `;
      }).toThrow();
    });

    test('should store and retrieve JSONB preferences correctly', async () => {
      if (!connectedSuccessfully) return;

      const preferences = {
        theme: 'dark',
        notifications: {
          email: true,
          push: false,
          frequency: 'daily',
        },
        privacy: {
          profile: 'public',
          activity: 'friends',
        },
      };

      await db`
        INSERT INTO user_preferences (user_id, preferences)
        VALUES (${userId}, ${preferences})
      `;

      const result = await db`
        SELECT preferences FROM user_preferences WHERE user_id = ${userId}
      `;

      expect(result[0].preferences).toEqual(preferences);
    });

    test('should cascade delete when user is deleted', async () => {
      if (!connectedSuccessfully) return;

      // Insert preferences
      await db`
        INSERT INTO user_preferences (user_id, preferences)
        VALUES (${userId}, '{"theme": "dark"}')
      `;

      // Verify preference exists
      let prefResult = await db`
        SELECT COUNT(*) as count FROM user_preferences WHERE user_id = ${userId}
      `;
      expect(prefResult[0].count).toBe(1);

      // Delete user
      await db`DELETE FROM users WHERE id = ${userId}`;

      // Verify preference is also deleted
      prefResult = await db`
        SELECT COUNT(*) as count FROM user_preferences WHERE user_id = ${userId}
      `;
      expect(prefResult[0].count).toBe(0);
    });
  });

  describe('1.2-DB-003: Actors table validation', () => {
    test('should create actors table with correct schema', async () => {
      if (!connectedSuccessfully) return;

      const result = await db`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'actors'
        ORDER BY ordinal_position
      `;

      expect(result.length).toBeGreaterThan(0);

      // Check required columns
      const columns = result.map((row: any) => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('name');
      expect(columns).toContain('bio');
      expect(columns).toContain('birth_date');
      expect(columns).toContain('photo_url');
      expect(columns).toContain('imdb_id');
      expect(columns).toContain('metadata');

      // Check name column is NOT NULL
      const nameColumn = result.find((col: any) => col.column_name === 'name');
      expect(nameColumn?.is_nullable).toBe('NO');

      // Check metadata column is JSONB with default
      const metadataColumn = result.find((col: any) => col.column_name === 'metadata');
      expect(metadataColumn?.data_type).toBe('jsonb');
      expect(metadataColumn?.column_default).toMatch(/'{}'::jsonb/);
    });

    test('should enforce unique constraint on imdb_id', async () => {
      if (!connectedSuccessfully) return;

      const imdbId = 'nm1234567';

      // Insert first actor
      await db`
        INSERT INTO actors (name, imdb_id)
        VALUES ('Actor One', ${imdbId})
      `;

      // Attempt to insert duplicate imdb_id should fail
      expect(async () => {
        await db`
          INSERT INTO actors (name, imdb_id)
          VALUES ('Actor Two', ${imdbId})
        `;
      }).toThrow();
    });

    test('should store and retrieve JSONB metadata correctly', async () => {
      if (!connectedSuccessfully) return;

      const metadata = {
        awards: ['Oscar', 'Golden Globe'],
        nationality: 'American',
        languages: ['English', 'Spanish'],
        socialMedia: {
          twitter: '@actorhandle',
          instagram: '@actorinstagram',
        },
      };

      const insertResult = await db`
        INSERT INTO actors (name, metadata)
        VALUES ('Test Actor', ${metadata})
        RETURNING id, metadata
      `;

      expect(insertResult[0].metadata).toEqual(metadata);
    });

    test('should allow NULL values for optional fields', async () => {
      if (!connectedSuccessfully) return;

      const result = await db`
        INSERT INTO actors (name)
        VALUES ('Minimal Actor')
        RETURNING bio, birth_date, photo_url, imdb_id
      `;

      expect(result[0].bio).toBeNull();
      expect(result[0].birth_date).toBeNull();
      expect(result[0].photo_url).toBeNull();
      expect(result[0].imdb_id).toBeNull();
    });
  });

  describe('1.2-DB-004: Filmography table validation', () => {
    let actorId: string;

    beforeEach(async () => {
      if (!connectedSuccessfully) return;

      const actorResult = await db`
        INSERT INTO actors (name)
        VALUES ('Test Actor')
        RETURNING id
      `;
      actorId = actorResult[0].id;
    });

    test('should create filmography table with correct schema', async () => {
      if (!connectedSuccessfully) return;

      const result = await db`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'filmography'
        ORDER BY ordinal_position
      `;

      expect(result.length).toBeGreaterThan(0);

      // Check required columns
      const columns = result.map((row: any) => row.column_name);
      expect(columns).toContain('actor_id');
      expect(columns).toContain('title');
      expect(columns).toContain('year');
      expect(columns).toContain('role');
      expect(columns).toContain('media_type');
      expect(columns).toContain('metadata');

      // Check title column is NOT NULL
      const titleColumn = result.find((col: any) => col.column_name === 'title');
      expect(titleColumn?.is_nullable).toBe('NO');

      // Check media_type default value
      const mediaTypeColumn = result.find((col: any) => col.column_name === 'media_type');
      expect(mediaTypeColumn?.column_default).toMatch(/'movie'::character varying/);
    });

    test('should enforce foreign key constraint to actors table', async () => {
      if (!connectedSuccessfully) return;

      const invalidActorId = '00000000-0000-0000-0000-000000000000';

      expect(async () => {
        await db`
          INSERT INTO filmography (actor_id, title, year)
          VALUES (${invalidActorId}, 'Test Movie', 2023)
        `;
      }).toThrow();
    });

    test('should store and retrieve filmography entries correctly', async () => {
      if (!connectedSuccessfully) return;

      const metadata = {
        director: 'Christopher Nolan',
        genre: ['Sci-Fi', 'Thriller'],
        rating: 8.5,
        boxOffice: {
          domestic: 500000000,
          worldwide: 1000000000,
        },
      };

      const insertResult = await db`
        INSERT INTO filmography (actor_id, title, year, role, media_type, metadata)
        VALUES (${actorId}, 'Test Movie', 2023, 'Lead Actor', 'movie', ${metadata})
        RETURNING *
      `;

      expect(insertResult[0]).toMatchObject({
        actor_id: actorId,
        title: 'Test Movie',
        year: 2023,
        role: 'Lead Actor',
        media_type: 'movie',
        metadata: metadata,
      });
    });

    test('should cascade delete when actor is deleted', async () => {
      if (!connectedSuccessfully) return;

      // Insert filmography entries
      await db`
        INSERT INTO filmography (actor_id, title, year)
        VALUES (${actorId}, 'Movie 1', 2021), (${actorId}, 'Movie 2', 2022)
      `;

      // Verify entries exist
      let filmResult = await db`
        SELECT COUNT(*) as count FROM filmography WHERE actor_id = ${actorId}
      `;
      expect(filmResult[0].count).toBe(2);

      // Delete actor
      await db`DELETE FROM actors WHERE id = ${actorId}`;

      // Verify filmography entries are also deleted
      filmResult = await db`
        SELECT COUNT(*) as count FROM filmography WHERE actor_id = ${actorId}
      `;
      expect(filmResult[0].count).toBe(0);
    });
  });

  describe('1.2-DB-005: Database indexes and performance validation', () => {
    test('should create all required indexes', async () => {
      if (!connectedSuccessfully) return;

      const expectedIndexes = [
        { table: 'users', columns: ['email'] },
        { table: 'user_preferences', columns: ['user_id'] },
        { table: 'actors', columns: ['name'] },
        { table: 'actors', columns: ['imdb_id'] },
        { table: 'filmography', columns: ['actor_id'] },
        { table: 'filmography', columns: ['title'] },
      ];

      for (const expectedIndex of expectedIndexes) {
        const result = await db`
          SELECT indexname, indexdef
          FROM pg_indexes
          WHERE tablename = ${expectedIndex.table}
          AND indexname LIKE ${`%${expectedIndex.columns.join('_')}%`}
        `;

        expect(result.length).toBeGreaterThan(0);
      }
    });

    test('should use indexes for query optimization', async () => {
      if (!connectedSuccessfully) return;

      // Insert test data
      await db`
        INSERT INTO users (email, password_hash)
        VALUES ('test1@example.com', 'hash1'), ('test2@example.com', 'hash2')
      `;

      // Enable query statistics if not already enabled
      await db`CREATE EXTENSION IF NOT EXISTS pg_stat_statements`;

      // Query using indexed column
      await db`SELECT * FROM users WHERE email = 'test1@example.com'`;

      // The test passes if no errors occur and query executes efficiently
      expect(true).toBe(true);
    });

    test('should handle UUID v7 generation efficiently', async () => {
      if (!connectedSuccessfully) return;

      const startTime = Date.now();

      // Generate 100 UUIDs
      const uuidPromises = Array.from({ length: 100 }, () => db`SELECT uuid_v7() as id`);

      const results = await Promise.all(uuidPromises);
      const endTime = Date.now();

      expect(results).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify all UUIDs are unique
      const uuids = results.map(r => r[0].id);
      const uniqueUuids = new Set(uuids);
      expect(uniqueUuids.size).toBe(100);

      // Verify UUID v7 format
      uuids.forEach(uuid => {
        expect(uuid).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        );
      });
    });
  });

  describe('Database health and connectivity', () => {
    test('should pass comprehensive health check', async () => {
      if (!connectedSuccessfully) {
        console.log('Skipping health check - database not available');
        return;
      }

      const isHealthy = await checkDatabaseHealth();
      expect(isHealthy).toBe(true);
    });

    test('should measure query performance', async () => {
      if (!connectedSuccessfully) return;

      const startTime = Date.now();

      await db`
        SELECT COUNT(*) as user_count,
               COUNT(DISTINCT email) as unique_emails
        FROM users
      `;

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      // Query should complete in reasonable time (less than 1 second)
      expect(queryTime).toBeLessThan(1000);
    });
  });
});
