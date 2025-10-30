import { connectDatabase } from '../src/index.js';

/**
 *
 */
async function runMigrations() {
  try {
    const db = connectDatabase({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: Number.parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'i_know_development',
      user: process.env.POSTGRES_USER || 'username',
      password: process.env.POSTGRES_PASSWORD || 'password',
      ssl: false,
    });

    console.log('🔄 Running database migrations...');

    // Create actors table
    await db`
      CREATE TABLE IF NOT EXISTS actors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        imdb_id VARCHAR(50) UNIQUE,
        image_url TEXT,
        biography TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create content table
    await db`
      CREATE TABLE IF NOT EXISTS content (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(50) NOT NULL CHECK (type IN ('movie', 'tv', 'documentary')),
        title VARCHAR(255) NOT NULL,
        year INTEGER,
        imdb_id VARCHAR(50) UNIQUE,
        poster_url TEXT,
        synopsis TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create actor_content junction table
    await db`
      CREATE TABLE IF NOT EXISTS actor_content (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_id UUID REFERENCES actors(id) ON DELETE CASCADE,
        content_id UUID REFERENCES content(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(actor_id, content_id)
      );
    `;

    // Create actor_detections table
    await db`
      CREATE TABLE IF NOT EXISTS actor_detections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content_id UUID REFERENCES content(id) ON DELETE CASCADE,
        actor_id UUID REFERENCES actors(id) ON DELETE CASCADE,
        confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        bounding_box JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create users table
    await db`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        preferences JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create indexes
    await db`CREATE INDEX IF NOT EXISTS idx_actors_name ON actors(name);`;
    await db`CREATE INDEX IF NOT EXISTS idx_actors_imdb_id ON actors(imdb_id);`;
    await db`CREATE INDEX IF NOT EXISTS idx_content_title ON content(title);`;
    await db`CREATE INDEX IF NOT EXISTS idx_content_imdb_id ON content(imdb_id);`;
    await db`CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);`;
    await db`CREATE INDEX IF NOT EXISTS idx_actor_detections_content_id ON actor_detections(content_id);`;
    await db`CREATE INDEX IF NOT EXISTS idx_actor_detections_actor_id ON actor_detections(actor_id);`;
    await db`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`;

    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  runMigrations();
}
