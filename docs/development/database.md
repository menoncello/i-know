# Database Schema Documentation

This document describes the database schema and data models for the I Know platform.

## 🏗️ Database Overview

- **Database**: PostgreSQL 18.0+
- **ORM**: Custom postgres client (via bun:postgres)
- **Migration**: Custom migration scripts
- **Primary Keys**: UUID v7
- **Timestamps**: UTC timezone

## 📊 Entity Relationship Diagram

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│    actors   │────▶│  actor_content  │◀────│   content   │
└─────────────┘     └─────────────────┘     └─────────────┘
      │                      │
      ▼                      ▼
┌─────────────────┐   ┌─────────────────┐
│ actor_detections│   │      users      │
└─────────────────┘   └─────────────────┘
```

## 📋 Tables

### actors

Stores actor information and metadata.

```sql
CREATE TABLE actors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  imdb_id VARCHAR(50) UNIQUE,
  image_url TEXT,
  biography TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**

| Column       | Type         | Constraints | Description                 |
| ------------ | ------------ | ----------- | --------------------------- |
| `id`         | UUID         | PRIMARY KEY | Unique identifier (UUID v7) |
| `name`       | VARCHAR(255) | NOT NULL    | Actor's full name           |
| `imdb_id`    | VARCHAR(50)  | UNIQUE      | IMDB identifier             |
| `image_url`  | TEXT         | -           | Profile image URL           |
| `biography`  | TEXT         | -           | Actor biography             |
| `created_at` | TIMESTAMP    | DEFAULT NOW | Creation timestamp          |
| `updated_at` | TIMESTAMP    | DEFAULT NOW | Last update timestamp       |

**Indexes:**

```sql
CREATE INDEX idx_actors_name ON actors(name);
CREATE INDEX idx_actors_imdb_id ON actors(imdb_id);
```

### content

Stores movies, TV shows, and other content.

```sql
CREATE TABLE content (
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
```

**Columns:**

| Column       | Type         | Constraints     | Description                         |
| ------------ | ------------ | --------------- | ----------------------------------- |
| `id`         | UUID         | PRIMARY KEY     | Unique identifier (UUID v7)         |
| `type`       | VARCHAR(50)  | NOT NULL, CHECK | Content type (movie/tv/documentary) |
| `title`      | VARCHAR(255) | NOT NULL        | Content title                       |
| `year`       | INTEGER      | -               | Release year                        |
| `imdb_id`    | VARCHAR(50)  | UNIQUE          | IMDB identifier                     |
| `poster_url` | TEXT         | -               | Poster image URL                    |
| `synopsis`   | TEXT         | -               | Content synopsis                    |
| `created_at` | TIMESTAMP    | DEFAULT NOW     | Creation timestamp                  |
| `updated_at` | TIMESTAMP    | DEFAULT NOW     | Last update timestamp               |

**Indexes:**

```sql
CREATE INDEX idx_content_title ON content(title);
CREATE INDEX idx_content_imdb_id ON content(imdb_id);
CREATE INDEX idx_content_type ON content(type);
CREATE INDEX idx_content_year ON content(year);
```

### actor_content

Junction table linking actors to content (many-to-many relationship).

```sql
CREATE TABLE actor_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  role VARCHAR(255),
  character_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(actor_id, content_id)
);
```

**Columns:**

| Column           | Type         | Constraints  | Description                       |
| ---------------- | ------------ | ------------ | --------------------------------- |
| `id`             | UUID         | PRIMARY KEY  | Unique identifier (UUID v7)       |
| `actor_id`       | UUID         | NOT NULL, FK | Reference to actors.id            |
| `content_id`     | UUID         | NOT NULL, FK | Reference to content.id           |
| `role`           | VARCHAR(255) | -            | Actor's role (e.g., "Lead Actor") |
| `character_name` | VARCHAR(255) | -            | Character name                    |
| `created_at`     | TIMESTAMP    | DEFAULT NOW  | Creation timestamp                |

**Indexes:**

```sql
CREATE INDEX idx_actor_content_actor_id ON actor_content(actor_id);
CREATE INDEX idx_actor_content_content_id ON actor_content(content_id);
```

### actor_detections

Stores actor detection results from content analysis.

```sql
CREATE TABLE actor_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
  confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  bounding_box JSONB,
  detection_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**

| Column             | Type        | Constraints     | Description                 |
| ------------------ | ----------- | --------------- | --------------------------- |
| `id`               | UUID        | PRIMARY KEY     | Unique identifier (UUID v7) |
| `content_id`       | UUID        | NOT NULL, FK    | Reference to content.id     |
| `actor_id`         | UUID        | NOT NULL, FK    | Reference to actors.id      |
| `confidence`       | FLOAT       | NOT NULL, CHECK | Detection confidence (0-1)  |
| `timestamp`        | TIMESTAMP   | DEFAULT NOW     | Detection timestamp         |
| `bounding_box`     | JSONB       | -               | Bounding box coordinates    |
| `detection_method` | VARCHAR(50) | -               | Detection algorithm used    |
| `created_at`       | TIMESTAMP   | DEFAULT NOW     | Creation timestamp          |

**Indexes:**

```sql
CREATE INDEX idx_actor_detections_content_id ON actor_detections(content_id);
CREATE INDEX idx_actor_detections_actor_id ON actor_detections(actor_id);
CREATE INDEX idx_actor_detections_confidence ON actor_detections(confidence);
CREATE INDEX idx_actor_detections_timestamp ON actor_detections(timestamp);
```

### users

Stores user accounts and preferences.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**

| Column        | Type         | Constraints      | Description                 |
| ------------- | ------------ | ---------------- | --------------------------- |
| `id`          | UUID         | PRIMARY KEY      | Unique identifier (UUID v7) |
| `email`       | VARCHAR(255) | UNIQUE, NOT NULL | User email address          |
| `preferences` | JSONB        | DEFAULT '{}'     | User preferences (JSON)     |
| `created_at`  | TIMESTAMP    | DEFAULT NOW      | Creation timestamp          |
| `updated_at`  | TIMESTAMP    | DEFAULT NOW      | Last update timestamp       |

**Indexes:**

```sql
CREATE INDEX idx_users_email ON users(email);
```

**User Preferences Schema:**

```json
{
  "favoriteActors": ["uuid1", "uuid2"],
  "watchlist": ["uuid1", "uuid2"],
  "notifications": true,
  "searchHistory": ["Tom Hanks", "Meryl Streep"],
  "theme": "dark"
}
```

## 🔍 Common Queries

### Get Actor with Content

```sql
SELECT
  a.id,
  a.name,
  a.imdb_id,
  a.image_url,
  a.biography,
  json_agg(
    json_build_object(
      'id', c.id,
      'title', c.title,
      'year', c.year,
      'type', c.type,
      'role', ac.role,
      'character_name', ac.character_name
    )
  ) as content
FROM actors a
LEFT JOIN actor_content ac ON a.id = ac.actor_id
LEFT JOIN content c ON ac.content_id = c.id
WHERE a.id = $1
GROUP BY a.id, a.name, a.imdb_id, a.image_url, a.biography;
```

### Search Actors

```sql
SELECT
  id,
  name,
  imdb_id,
  image_url,
  ts_rank(search_vector, plainto_tsquery('english', $1)) as relevance
FROM actors
WHERE search_vector @@ plainto_tsquery('english', $1)
ORDER BY relevance DESC, name ASC
LIMIT $2 OFFSET $3;
```

### Get Content with Actors

```sql
SELECT
  c.id,
  c.title,
  c.year,
  c.type,
  c.poster_url,
  c.synopsis,
  json_agg(
    json_build_object(
      'id', a.id,
      'name', a.name,
      'imdb_id', a.imdb_id,
      'role', ac.role,
      'character_name', ac.character_name
    )
  ) as actors
FROM content c
LEFT JOIN actor_content ac ON c.id = ac.content_id
LEFT JOIN actors a ON ac.actor_id = a.id
WHERE c.id = $1
GROUP BY c.id, c.title, c.year, c.type, c.poster_url, c.synopsis;
```

## 🔄 Migration Process

### Running Migrations

```bash
# Run all pending migrations
bun run db:migrate

# Run specific migration
bun run packages/database/scripts/migrate.ts
```

### Migration File Structure

```typescript
// packages/database/migrations/001_initial_schema.ts
export async function up(sql: postgres.SqlInstance) {
  await sql`CREATE TABLE actors (...)`;
  await sql`CREATE TABLE content (...)`;
  // ... other tables
}

export async function down(sql: postgres.SqlInstance) {
  await sql`DROP TABLE IF EXISTS actor_detections`;
  await sql`DROP TABLE IF EXISTS actor_content`;
  await sql`DROP TABLE IF EXISTS actors`;
  await sql`DROP TABLE IF EXISTS content`;
  await sql`DROP TABLE IF EXISTS users`;
}
```

## 🌱 Seeding Data

### Sample Data

```bash
# Seed with sample data
bun run db:seed

# Reset and reseed
bun run db:reset
```

### Seed Data Structure

- **5 Sample Actors**: Tom Hanks, Meryl Streep, Leonardo DiCaprio, Jennifer Lawrence, Robert De Niro
- **5 Sample Movies**: Forrest Gump, The Devil Wears Prada, Inception, The Hunger Games, Silver Linings Playbook
- **Actor-Content Relationships**: Proper relationships between actors and movies
- **Sample User**: Demo user with preferences

## 🔧 Performance Optimization

### Indexes

All frequently queried columns are indexed:

- Primary keys (UUID)
- Foreign keys
- Search fields (name, title)
- Unique constraints (imdb_id, email)
- Timestamps (created_at, updated_at)

### Query Optimization

- Use **EXPLAIN ANALYZE** to analyze query performance
- Implement **connection pooling** for high traffic
- Consider **read replicas** for scaling reads
- Use **materialized views** for complex aggregations

### Database Connection

```typescript
// Connection pooling configuration
const sql = postgres({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  max: 20, // Maximum connections
  idle_timeout: 30, // Idle timeout
  connect_timeout: 10, // Connection timeout
});
```

## 🚀 Backup and Recovery

### Backup Strategy

```bash
# Create backup
pg_dump -h localhost -U postgres -d i_know_development > backup.sql

# Restore from backup
psql -h localhost -U postgres -d i_know_development < backup.sql
```

### Point-in-Time Recovery

Configure WAL (Write-Ahead Logging) for point-in-time recovery:

```sql
-- Enable WAL in postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /backup/wal/%f'
```

## 🔍 Monitoring

### Database Metrics

Monitor key metrics:

- **Connection count**
- **Query performance**
- **Table sizes**
- **Index usage**
- **Lock contention**

### Sample Monitoring Query

```sql
-- Check slow queries
SELECT
  query,
  mean_time,
  calls,
  total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## 🧪 Testing

### Test Database

Use separate test database:

```bash
# Set test database URL
export DATABASE_URL="postgresql://postgres:password@localhost:5432/i_know_test"

# Run migrations
bun run db:migrate

# Run tests
bun test tests/integration/database.test.ts
```

### Test Data Factory

```typescript
// packages/database/src/factory.ts
export function createActor(overrides: Partial<Actor> = {}): Actor {
  return {
    id: generateId(),
    name: faker.person.fullName(),
    imdbId: `nm${faker.number.int({ min: 1000000, max: 9999999 })}`,
    biography: faker.lorem.paragraph(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
```
