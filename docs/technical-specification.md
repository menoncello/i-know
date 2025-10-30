# I Know - Technical Specification Document

**Version**: 1.0
**Date**: 2025-10-29
**Author**: Eduardo Menoncello
**Project Type**: Level 3 Greenfield Software
**Target Audience**: Development Team, Implementation Engineers

---

## Executive Summary

This technical specification provides detailed implementation guidance for the I Know entertainment intelligence platform. It expands on the architectural decisions with concrete patterns, standards, and specifications needed for Phase 4 implementation. The document covers data models, API specifications, performance requirements, security implementation, testing strategies, and deployment configurations.

**Key Technical Requirements:**

- Sub-500ms response times for actor identification
- 99.5% uptime with 99.9% accuracy in actor recognition
- Mobile-first progressive web applications
- Real-time data synchronization across platforms
- Scalable architecture supporting 1M+ concurrent users

---

## 1. Data Models & Schemas

### 1.1 Core Entity Definitions

#### Actor Model

```typescript
// packages/types/src/actor-types.ts
export interface Actor {
  id: string; // UUID v7
  name: string;
  bio?: string;
  birthDate?: string; // ISO 8601 date format
  photoUrl?: string;
  imdbId?: string;
  knownFor: string[]; // Array of known content titles
  filmography: FilmographyEntry[];
  metadata: ActorMetadata;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

export interface FilmographyEntry {
  contentId: string;
  title: string;
  type: 'movie' | 'series' | 'episode';
  year: number;
  roleName: string;
  isMainRole: boolean;
  characterType?: 'lead' | 'supporting' | 'cameo';
  episodeCount?: number; // For series
}

export interface ActorMetadata {
  searchVector: string; // PostgreSQL tsvector
  popularityScore: number; // 0-100
  lastScrapedAt: string;
  scrapeSource: 'api' | 'scraper' | 'manual';
  qualityFlags: ActorQualityFlags;
}

export interface ActorQualityFlags {
  hasValidPhoto: boolean;
  hasCompleteFilmography: boolean;
  hasBirthDate: boolean;
  hasBio: boolean;
  lastVerified: string;
}
```

#### User Model

```typescript
// packages/types/src/user-types.ts
export interface User {
  id: string; // UUID v7
  email: string;
  username: string;
  preferences: UserPreferences;
  subscription: UserSubscription;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  discovery: DiscoveryPreferences;
  ui: UIPreferences;
}

export interface NotificationPreferences {
  newContentAlerts: boolean;
  actorUpdates: boolean;
  emailDigest: 'daily' | 'weekly' | 'monthly' | 'never';
  pushNotifications: boolean;
}

export interface DiscoveryPreferences {
  preferredGenres: string[];
  preferredDecades: number[];
  avoidSpoilers: boolean;
  autoDetect: boolean;
}

export interface UIPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  compactMode: boolean;
  showRatings: boolean;
}
```

#### Content Model

```typescript
// packages/types/src/content-types.ts
export interface Content {
  id: string; // UUID v7
  title: string;
  type: 'movie' | 'series' | 'episode';
  releaseYear: number;
  imdbId?: string;
  posterUrl?: string;
  backdropUrl?: string;
  runtime?: number; // minutes
  genres: string[];
  description?: string;
  cast: ActorRole[];
  metadata: ContentMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface ActorRole {
  actorId: string;
  roleName: string;
  isMainRole: boolean;
  characterType: 'lead' | 'supporting' | 'cameo';
  order: number; // Order in credits
  episodeCount?: number;
}

export interface ContentMetadata {
  searchVector: string; // PostgreSQL tsvector
  popularityScore: number;
  rating?: number; // 0-10
  votes?: number;
  lastScrapedAt: string;
  scrapeSource: 'api' | 'scraper' | 'manual';
  qualityFlags: ContentQualityFlags;
}
```

### 1.2 Database Schema

#### Primary Tables

```sql
-- packages/database/src/schemas/actors.sql
CREATE TYPE content_type AS ENUM ('movie', 'series', 'episode');
CREATE TYPE role_type AS ENUM ('lead', 'supporting', 'cameo');
CREATE TYPE watchlist_status AS ENUM ('to_watch', 'watching', 'completed', 'paused');
CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'family');

-- Actors table
CREATE TABLE actors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  name VARCHAR(255) NOT NULL,
  bio TEXT,
  birth_date DATE,
  photo_url TEXT,
  imdb_id VARCHAR(50) UNIQUE,
  known_for TEXT[], -- Array of known content titles
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', name), 'A') ||
    setweight(to_tsvector('english', COALESCE(bio, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(known_for, ' ')), 'C')
  ) STORED,
  popularity_score INTEGER DEFAULT 0 CHECK (popularity_score >= 0 AND popularity_score <= 100),
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  scrape_source VARCHAR(20) DEFAULT 'manual',
  has_valid_photo BOOLEAN DEFAULT FALSE,
  has_complete_filmography BOOLEAN DEFAULT FALSE,
  has_birth_date BOOLEAN DEFAULT FALSE,
  has_bio BOOLEAN DEFAULT FALSE,
  last_verified TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content table
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  title VARCHAR(500) NOT NULL,
  type content_type NOT NULL,
  release_year INTEGER CHECK (release_year >= 1888 AND release_year <= EXTRACT(YEAR FROM NOW()) + 5),
  imdb_id VARCHAR(50) UNIQUE,
  poster_url TEXT,
  backdrop_url TEXT,
  runtime INTEGER CHECK (runtime > 0 AND runtime <= 600), -- minutes
  genres TEXT[],
  description TEXT,
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', title), 'A') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(genres, ' ')), 'C')
  ) STORED,
  popularity_score INTEGER DEFAULT 0 CHECK (popularity_score >= 0 AND popularity_score <= 100),
  rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 10),
  votes INTEGER DEFAULT 0,
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  scrape_source VARCHAR(20) DEFAULT 'manual',
  has_valid_poster BOOLEAN DEFAULT FALSE,
  has_valid_backdrop BOOLEAN DEFAULT FALSE,
  has_complete_cast BOOLEAN DEFAULT FALSE,
  has_rating BOOLEAN DEFAULT FALSE,
  last_verified TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Filmography table (many-to-many relationship)
CREATE TABLE filmography (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  actor_id UUID NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  role_name VARCHAR(255) NOT NULL,
  is_main_role BOOLEAN DEFAULT FALSE,
  character_type role_type DEFAULT 'supporting',
  "order" INTEGER DEFAULT 0 CHECK ("order" >= 0),
  episode_count INTEGER DEFAULT 0 CHECK (episode_count >= 0),
  year INTEGER CHECK (year >= 1888 AND year <= EXTRACT(YEAR FROM NOW()) + 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(actor_id, content_id, role_name)
);
```

#### User Tables

```sql
-- packages/database/src/schemas/users.sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE,
  login_count INTEGER DEFAULT 0,
  preferences JSONB DEFAULT '{}',
  subscription_tier subscription_tier DEFAULT 'free',
  subscription_expires TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Viewing history table
CREATE TABLE viewing_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES actors(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration INTEGER, -- minutes watched
  total_duration INTEGER, -- total content duration
  completion_percentage DECIMAL(5,2) CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  context JSONB DEFAULT '{}', -- platform, episode, season, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, actor_id, content_id, DATE(viewed_at))
);

-- Watchlist table
CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  status watchlist_status DEFAULT 'to_watch',
  priority INTEGER DEFAULT 0 CHECK (priority >= 0 AND priority <= 10),
  notes TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, content_id)
);
```

#### Performance Indexes

```sql
-- packages/database/src/schemas/indexes.sql
-- Search optimization indexes
CREATE INDEX CONCURRENTLY idx_actors_name_search ON actors USING gin(search_vector);
CREATE INDEX CONCURRENTLY idx_content_title_search ON content USING gin(search_vector);
CREATE INDEX CONCURRENTLY idx_actors_popularity ON actors(popularity_score DESC, name);
CREATE INDEX CONCURRENTLY idx_content_popularity ON content(popularity_score DESC, title);

-- Join optimization indexes
CREATE INDEX CONCURRENTLY idx_filmography_actor ON filmography(actor_id, year DESC);
CREATE INDEX CONCURRENTLY idx_filmography_content ON filmography(content_id, "order");
CREATE INDEX CONCURRENTLY idx_filmography_main_roles ON filmography(is_main_role, character_type) WHERE is_main_role = TRUE;

-- User data indexes
CREATE INDEX CONCURRENTLY idx_viewing_history_user_time ON viewing_history(user_id, viewed_at DESC);
CREATE INDEX CONCURRENTLY idx_viewing_history_actor ON viewing_history(actor_id, viewed_at DESC);
CREATE INDEX CONCURRENTLY idx_viewing_history_content ON viewing_history(content_id, viewed_at DESC);
CREATE INDEX CONCURRENTLY idx_watchlist_user_status ON watchlist(user_id, status, priority DESC, added_at DESC);

-- Performance optimization indexes
CREATE INDEX CONCURRENTLY idx_actors_last_scraped ON actors(last_scraped_at) WHERE last_scraped_at IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_content_last_scraped ON content(last_scraped_at) WHERE last_scraped_at IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_users_subscription ON users(subscription_tier, subscription_expires);
```

### 1.3 Database Triggers & Functions

#### Update Timestamps

```sql
-- packages/database/src/schemas/triggers.sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at column
CREATE TRIGGER update_actors_updated_at BEFORE UPDATE ON actors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Search Vector Updates

```sql
-- Function to update search vectors
CREATE OR REPLACE FUNCTION update_actor_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', NEW.name), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.bio, '')), 'B') ||
        setweight(to_tsvector('english', array_to_string(NEW.known_for, ' ')), 'C');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_actor_search_vector_trigger BEFORE INSERT OR UPDATE ON actors
    FOR EACH ROW EXECUTE FUNCTION update_actor_search_vector();
```

---

## 2. API Specifications

### 2.1 API Design Standards

#### Response Format

```typescript
// packages/types/src/api-types.ts
export interface APIResponse<T = any> {
  data?: T;
  error?: APIError;
  meta?: ResponseMeta;
  pagination?: PaginationMeta;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  requestId: string;
}

export interface ResponseMeta {
  requestId: string;
  timestamp: string;
  version: string;
  processingTime: number;
}

export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  nextPage?: number;
  prevPage?: number;
}
```

#### Error Codes

```typescript
export const ErrorCodes = {
  // Authentication errors (1000-1099)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // Validation errors (1100-1199)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Resource errors (1200-1299)
  NOT_FOUND: 'NOT_FOUND',
  ACTOR_NOT_FOUND: 'ACTOR_NOT_FOUND',
  CONTENT_NOT_FOUND: 'CONTENT_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',

  // Business logic errors (1300-1399)
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  DUPLICATE_USERNAME: 'DUPLICATE_USERNAME',
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',

  // System errors (1400-1499)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;
```

### 2.2 Actor API Endpoints

#### GET /api/v1/actors/:id

```typescript
// apps/api/src/routes/actors/[id].ts
import { Elysia, t } from 'elysia';
import { ActorService } from '../../services/actor-service';

export const getActorRoute = (app: Elysia) =>
  app.get(
    '/actors/:id',
    async ({ params, set, request }) => {
      const requestId = request.headers.get('x-request-id') || generateRequestId();
      const startTime = Date.now();

      try {
        const actorService = new ActorService();
        const actor = await actorService.getActorById(params.id);

        if (!actor) {
          set.status = 404;
          return {
            error: {
              code: 'ACTOR_NOT_FOUND',
              message: 'Actor with specified ID not found',
              details: { actorId: params.id },
              timestamp: new Date().toISOString(),
              requestId,
            },
          };
        }

        return {
          data: actor,
          meta: {
            requestId,
            timestamp: new Date().toISOString(),
            version: '1.0',
            processingTime: Date.now() - startTime,
          },
        };
      } catch (error) {
        set.status = 500;
        return {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
            details: { originalError: error.message },
            timestamp: new Date().toISOString(),
            requestId,
          },
        };
      }
    },
    {
      params: t.Object({
        id: t.String({
          format: 'uuid',
          error: 'Invalid actor ID format',
        }),
      }),
      response: {
        200: t.Object({
          data: t.Any(),
          meta: t.Object({
            requestId: t.String(),
            timestamp: t.String(),
            version: t.String(),
            processingTime: t.Number(),
          }),
        }),
        404: t.Object({
          error: t.Object({
            code: t.String(),
            message: t.String(),
            details: t.Optional(t.Any()),
            timestamp: t.String(),
            requestId: t.String(),
          }),
        }),
      },
    },
  );
```

#### GET /api/v1/actors/search

```typescript
// apps/api/src/routes/actors/search.ts
export const searchActorsRoute = (app: Elysia) =>
  app.get(
    '/actors/search',
    async ({ query, set, request }) => {
      const requestId = request.headers.get('x-request-id') || generateRequestId();
      const startTime = Date.now();

      // Validate search parameters
      const validation = validateSearchQuery(query);
      if (!validation.valid) {
        set.status = 400;
        return {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid search parameters',
            details: validation.errors,
            timestamp: new Date().toISOString(),
            requestId,
          },
        };
      }

      try {
        const actorService = new ActorService();
        const result = await actorService.searchActors({
          query: query.q,
          limit: Math.min(parseInt(query.limit) || 20, 100),
          offset: Math.max(parseInt(query.offset) || 0, 0),
          contentType: query.type,
          year: query.year ? parseInt(query.year) : undefined,
          sortBy: query.sortBy || 'relevance',
          sortOrder: query.sortOrder || 'desc',
        });

        return {
          data: result.actors,
          meta: {
            requestId,
            timestamp: new Date().toISOString(),
            version: '1.0',
            processingTime: Date.now() - startTime,
            searchTime: result.searchTime,
          },
          pagination: {
            total: result.total,
            limit: result.limit,
            offset: result.offset,
            hasMore: result.hasMore,
            nextPage: result.hasMore ? result.offset + result.limit : undefined,
            prevPage: result.offset > 0 ? Math.max(0, result.offset - result.limit) : undefined,
          },
        };
      } catch (error) {
        set.status = 500;
        return {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Search failed',
            details: { originalError: error.message },
            timestamp: new Date().toISOString(),
            requestId,
          },
        };
      }
    },
    {
      query: t.Object({
        q: t.String({
          minLength: 1,
          maxLength: 100,
          error: 'Search query must be 1-100 characters',
        }),
        limit: t.Optional(
          t.String({
            pattern: '^[0-9]+$',
            error: 'Limit must be a positive integer',
          }),
        ),
        offset: t.Optional(
          t.String({
            pattern: '^[0-9]+$',
            error: 'Offset must be a non-negative integer',
          }),
        ),
        type: t.Optional(t.Union([t.Literal('movie'), t.Literal('series'), t.Literal('all')])),
        year: t.Optional(
          t.String({
            pattern: '^[0-9]{4}$',
            error: 'Year must be a 4-digit number',
          }),
        ),
        sortBy: t.Optional(
          t.Union([
            t.Literal('relevance'),
            t.Literal('name'),
            t.Literal('popularity'),
            t.Literal('year'),
          ]),
        ),
        sortOrder: t.Optional(t.Union([t.Literal('asc'), t.Literal('desc')])),
      }),
      response: {
        200: t.Object({
          data: t.Array(t.Any()),
          meta: t.Object({
            requestId: t.String(),
            timestamp: t.String(),
            version: t.String(),
            processingTime: t.Number(),
            searchTime: t.Number(),
          }),
          pagination: t.Object({
            total: t.Number(),
            limit: t.Number(),
            offset: t.Number(),
            hasMore: t.Boolean(),
            nextPage: t.Optional(t.Number()),
            prevPage: t.Optional(t.Number()),
          }),
        }),
      },
    },
  );
```

### 2.3 User API Endpoints

#### POST /api/v1/users/register

```typescript
// apps/api/src/routes/users/register.ts
export const registerUserRoute = (app: Elysia) =>
  app.post(
    '/users/register',
    async ({ body, set, request }) => {
      const requestId = request.headers.get('x-request-id') || generateRequestId();
      const startTime = Date.now();

      // Validate input
      const validation = validateRegistrationInput(body);
      if (!validation.valid) {
        set.status = 400;
        return {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid registration data',
            details: validation.errors,
            timestamp: new Date().toISOString(),
            requestId,
          },
        };
      }

      try {
        const userService = new UserService();

        // Check for existing email/username
        const existing = await userService.findExistingUser(body.email, body.username);
        if (existing) {
          set.status = 409;
          return {
            error: {
              code: existing.email === body.email ? 'DUPLICATE_EMAIL' : 'DUPLICATE_USERNAME',
              message: `User with this ${existing.email === body.email ? 'email' : 'username'} already exists`,
              timestamp: new Date().toISOString(),
              requestId,
            },
          };
        }

        // Create user
        const user = await userService.createUser({
          email: body.email,
          username: body.username,
          password: body.password,
          preferences: {
            notifications: {
              newContentAlerts: true,
              actorUpdates: true,
              emailDigest: 'weekly',
              pushNotifications: false,
            },
            privacy: {
              profileVisibility: 'public',
              shareViewingHistory: false,
              allowRecommendations: true,
            },
            discovery: {
              preferredGenres: [],
              preferredDecades: [],
              avoidSpoilers: true,
              autoDetect: true,
            },
            ui: {
              theme: 'auto',
              language: 'en',
              compactMode: false,
              showRatings: true,
            },
          },
        });

        // Generate verification token
        const verificationToken = await userService.generateEmailVerificationToken(user.id);

        // Send verification email (async)
        sendVerificationEmail(user.email, verificationToken).catch(console.error);

        set.status = 201;
        return {
          data: {
            id: user.id,
            email: user.email,
            username: user.username,
            emailVerified: false,
            preferences: user.preferences,
            createdAt: user.createdAt,
          },
          meta: {
            requestId,
            timestamp: new Date().toISOString(),
            version: '1.0',
            processingTime: Date.now() - startTime,
          },
        };
      } catch (error) {
        set.status = 500;
        return {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Registration failed',
            details: { originalError: error.message },
            timestamp: new Date().toISOString(),
            requestId,
          },
        };
      }
    },
    {
      body: t.Object({
        email: t.String({
          format: 'email',
          error: 'Valid email address required',
        }),
        username: t.String({
          minLength: 3,
          maxLength: 30,
          pattern: '^[a-zA-Z0-9_-]+$',
          error: 'Username must be 3-30 characters, alphanumeric and underscore only',
        }),
        password: t.String({
          minLength: 12,
          error: 'Password must be at least 12 characters long',
        }),
      }),
      response: {
        201: t.Object({
          data: t.Object({
            id: t.String(),
            email: t.String(),
            username: t.String(),
            emailVerified: t.Boolean(),
            preferences: t.Any(),
            createdAt: t.String(),
          }),
          meta: t.Object({
            requestId: t.String(),
            timestamp: t.String(),
            version: t.String(),
            processingTime: t.Number(),
          }),
        }),
      },
    },
  );
```

---

## 3. Performance Implementation Patterns

### 3.1 Sub-500ms Response Time Requirements

#### Caching Strategy

```typescript
// packages/utils/src/cache-manager.ts
export class CacheManager {
  private redis: Redis;
  private localCache: LRUCache<string, any>;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.localCache = new LRUCache({ max: 1000, ttl: 5 * 60 * 1000 }); // 5 minutes
  }

  async get<T>(key: string): Promise<T | null> {
    // Try local cache first (fastest)
    const localResult = this.localCache.get(key);
    if (localResult) {
      return localResult;
    }

    // Try Redis cache (medium speed)
    const redisResult = await this.redis.get(key);
    if (redisResult) {
      const parsed = JSON.parse(redisResult);
      // Store in local cache for next request
      this.localCache.set(key, parsed);
      return parsed;
    }

    return null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    const serialized = JSON.stringify(value);

    // Set both caches
    this.localCache.set(key, value);
    await this.redis.setex(key, ttl, serialized);
  }

  async invalidate(pattern: string): Promise<void> {
    // Clear matching keys from both caches
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }

    // Clear local cache entries matching pattern
    for (const key of this.localCache.keys()) {
      if (key.match(pattern)) {
        this.localCache.delete(key);
      }
    }
  }
}

// Usage in services
export class ActorService {
  private cache = new CacheManager();

  async getActorById(id: string): Promise<Actor | null> {
    const cacheKey = `actor:${id}`;

    // Try cache first
    const cached = await this.cache.get<Actor>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const actor = await this.database.getActor(id);
    if (actor) {
      // Cache for 1 hour
      await this.cache.set(cacheKey, actor, 3600);
    }

    return actor;
  }
}
```

#### Database Query Optimization

```typescript
// packages/database/src/query-optimizer.ts
export class QueryOptimizer {
  // Optimized actor search with PostgreSQL full-text search
  async searchActors(query: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();

    // Use prepared statements for better performance
    const searchQuery = `
      SELECT
        a.id, a.name, a.photo_url, a.known_for, a.popularity_score,
        ts_rank(a.search_vector, plainto_tsquery('english', $1)) as relevance_score,
        COUNT(f.id) as filmography_count
      FROM actors a
      LEFT JOIN filmography f ON a.id = f.actor_id
      WHERE a.search_vector @@ plainto_tsquery('english', $1)
        AND ($2::content_type IS NULL OR EXISTS (
          SELECT 1 FROM filmography f2
          JOIN content c ON f2.content_id = c.id
          WHERE f2.actor_id = a.id AND c.type = $2
        ))
        AND ($3::integer IS NULL OR EXISTS (
          SELECT 1 FROM filmography f3
          JOIN content c ON f3.content_id = c.id
          WHERE f3.actor_id = a.id AND c.release_year = $3
        ))
      GROUP BY a.id, a.name, a.photo_url, a.known_for, a.popularity_score
      ORDER BY relevance_score DESC, a.popularity_score DESC, a.name ASC
      LIMIT $4 OFFSET $5
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT a.id) as total
      FROM actors a
      WHERE a.search_vector @@ plainto_tsquery('english', $1)
        AND ($2::content_type IS NULL OR EXISTS (
          SELECT 1 FROM filmography f2
          JOIN content c ON f2.content_id = c.id
          WHERE f2.actor_id = a.id AND c.type = $2
        ))
        AND ($3::integer IS NULL OR EXISTS (
          SELECT 1 FROM filmography f3
          JOIN content c ON f3.content_id = c.id
          WHERE f3.actor_id = a.id AND c.release_year = $3
        ))
    `;

    try {
      // Execute queries in parallel
      const [actorsResult, countResult] = await Promise.all([
        this.database.query(searchQuery, [
          query.query,
          query.contentType || null,
          query.year || null,
          query.limit,
          query.offset,
        ]),
        this.database.query(countQuery, [
          query.query,
          query.contentType || null,
          query.year || null,
        ]),
      ]);

      const searchTime = Date.now() - startTime;

      return {
        actors: actorsResult.rows,
        total: parseInt(countResult.rows[0].total),
        searchTime,
      };
    } catch (error) {
      throw new DatabaseError('Actor search failed', error);
    }
  }
}
```

#### Connection Pooling

```typescript
// packages/database/src/connection-pool.ts
import { Pool } from 'pg';

export class DatabaseManager {
  private pool: Pool;
  private readonly poolConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20, // Maximum number of connections
    min: 5, // Minimum number of connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    statement_timeout: 5000, // Query timeout
    query_timeout: 5000,
    application_name: 'iknow-api',
  };

  constructor() {
    this.pool = new Pool(this.poolConfig);

    // Handle pool errors
    this.pool.on('error', err => {
      console.error('Unexpected error on idle client', err);
    });
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
    const client = await this.pool.connect();
    try {
      const start = Date.now();
      const result = await client.query(sql, params);
      const duration = Date.now() - start;

      // Log slow queries
      if (duration > 100) {
        console.warn(`Slow query (${duration}ms):`, sql, params);
      }

      return result;
    } finally {
      client.release();
    }
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
```

### 3.2 Mobile-First Performance

#### Progressive Web App Configuration

```typescript
// apps/web/src/pwa-config.ts
export const PWAConfig = {
  name: 'I Know - Actor Identification',
  short_name: 'I Know',
  description: 'Instant actor identification and discovery',
  theme_color: '#10b981',
  background_color: '#000000',
  display: 'standalone',
  orientation: 'portrait',
  start_url: '/',
  scope: '/',
  icons: [
    {
      src: '/icons/icon-72x72.png',
      sizes: '72x72',
      type: 'image/png',
    },
    {
      src: '/icons/icon-96x96.png',
      sizes: '96x96',
      type: 'image/png',
    },
    {
      src: '/icons/icon-128x128.png',
      sizes: '128x128',
      type: 'image/png',
    },
    {
      src: '/icons/icon-144x144.png',
      sizes: '144x144',
      type: 'image/png',
    },
    {
      src: '/icons/icon-152x152.png',
      sizes: '152x152',
      type: 'image/png',
    },
    {
      src: '/icons/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png',
    },
    {
      src: '/icons/icon-384x384.png',
      sizes: '384x384',
      type: 'image/png',
    },
    {
      src: '/icons/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png',
    },
  ],
};

// Service Worker for caching
export const serviceWorkerCode = `
const CACHE_NAME = 'iknow-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Network request with cache fallback
        return fetch(event.request).catch(() => {
          // Return cached version if network fails
          return caches.match(event.request);
        });
      })
  );
});
`;
```

#### Image Optimization

```typescript
// packages/utils/src/image-optimizer.ts
export class ImageOptimizer {
  // Generate responsive image sizes
  static generateResponsiveImages(originalUrl: string): ResponsiveImage[] {
    const baseUrl = originalUrl.replace(/\.[^.]+$/, '');
    const extension = originalUrl.match(/\.[^.]+$/)?.[0] || '.jpg';

    return [
      { src: `${baseUrl}-small${extension}`, width: 150, height: 150 },
      { src: `${baseUrl}-medium${extension}`, width: 300, height: 300 },
      { src: `${baseUrl}-large${extension}`, width: 600, height: 600 }
    ];
  }

  // Lazy loading component
  static createLazyImage(imageUrl: string, alt: string): string {
    return `
      <img
        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'%3E%3C/svg%3E"
        data-src="${imageUrl}"
        alt="${alt}"
        loading="lazy"
        class="lazy-image transition-opacity duration-300"
        onerror="this.src='/images/placeholder.jpg'"
      />
    `;
  }

  // Progressive image loading
  static async preloadImage(imageUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = imageUrl;
    });
  }
}

// React component for optimized images
// packages/ui/src/components/optimized-image.tsx
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean; // Eager load for important images
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const img = imgRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Load image when it comes into viewport
            img.src = src;
            observer.unobserve(img);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (priority) {
      // Eager load for priority images
      img.src = src;
    } else {
      // Lazy load for non-priority images
      observer.observe(img);
    }

    return () => observer.disconnect();
  }, [src, priority]);

  return (
    <img
      ref={imgRef}
      alt={alt}
      width={width}
      height={height}
      className={`${className} transition-opacity duration-300 ${
        loaded ? 'opacity-100' : 'opacity-0'
      }`}
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
      src={priority ? src : undefined}
      style={{
        backgroundColor: loaded ? 'transparent' : '#f3f4f6',
        ...(width && height ? { aspectRatio: `${width}/${height}` } : {})
      }}
    />
  );
};
```

---

## 4. Error Handling Standards

### 4.1 Backend Error Handling

#### Structured Error Handling

```typescript
// packages/utils/src/error-handler.ts
export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any,
    public cause?: Error,
  ) {
    super(message);
    this.name = 'APIError';

    // Maintain stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError);
    }
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: new Date().toISOString(),
    };
  }
}

export class ValidationError extends APIError {
  constructor(
    message: string,
    public field?: string,
    value?: any,
  ) {
    super('VALIDATION_ERROR', message, 400, { field, value });
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string, id?: string) {
    super('NOT_FOUND', `${resource}${id ? ` with ID ${id}` : ''} not found`, 404, { resource, id });
    this.name = 'NotFoundError';
  }
}

export class DatabaseError extends APIError {
  constructor(
    message: string,
    public originalError: Error,
  ) {
    super(
      'DATABASE_ERROR',
      'Database operation failed',
      500,
      { originalError: originalError.message },
      originalError,
    );
    this.name = 'DatabaseError';
  }
}

// Error handling middleware for Elysia
export const errorHandler = (error: Error) => {
  console.error('API Error:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    cause: (error as any).cause,
  });

  if (error instanceof APIError) {
    return {
      error: error.toJSON(),
      statusCode: error.statusCode,
    };
  }

  // Unknown errors
  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    },
    statusCode: 500,
  };
};
```

#### Service Layer Error Handling

```typescript
// apps/api/src/services/actor-service.ts
export class ActorService {
  constructor(private database: DatabaseManager) {}

  async getActorById(id: string): Promise<Actor> {
    try {
      if (!isValidUUID(id)) {
        throw new ValidationError('Invalid actor ID format', 'id', id);
      }

      const result = await this.database.query('SELECT * FROM actors WHERE id = $1', [id]);

      if (result.rows.length === 0) {
        throw new NotFoundError('Actor', id);
      }

      return this.mapRowToActor(result.rows[0]);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      // Log unexpected errors
      console.error('Unexpected error in getActorById:', error);
      throw new DatabaseError('Failed to fetch actor', error as Error);
    }
  }

  async searchActors(query: SearchQuery): Promise<SearchResult> {
    try {
      // Validate search query
      if (!query.query || query.query.trim().length === 0) {
        throw new ValidationError('Search query is required', 'query');
      }

      if (query.query.length > 100) {
        throw new ValidationError(
          'Search query too long (max 100 characters)',
          'query',
          query.query.length,
        );
      }

      const searchQuery = this.buildSearchQuery(query);
      const result = await this.database.query(searchQuery.sql, searchQuery.params);

      return {
        actors: result.rows.map(row => this.mapRowToActorSummary(row)),
        total: result.rows.length > 0 ? result.rows[0].total_count : 0,
      };
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      console.error('Unexpected error in searchActors:', error);
      throw new DatabaseError('Search failed', error as Error);
    }
  }

  private buildSearchQuery(query: SearchQuery): { sql: string; params: any[] } {
    // Build safe SQL with parameterized queries
    const conditions = ['a.search_vector @@ plainto_tsquery($1)'];
    const params = [query.query];
    let paramIndex = 2;

    if (query.contentType) {
      conditions.push(
        `EXISTS (SELECT 1 FROM filmography f JOIN content c ON f.content_id = c.id WHERE f.actor_id = a.id AND c.type = $${paramIndex})`,
      );
      params.push(query.contentType);
      paramIndex++;
    }

    if (query.year) {
      conditions.push(
        `EXISTS (SELECT 1 FROM filmography f JOIN content c ON f.content_id = c.id WHERE f.actor_id = a.id AND c.release_year = $${paramIndex})`,
      );
      params.push(query.year);
      paramIndex++;
    }

    const sql = `
      SELECT DISTINCT ON (a.id)
        a.*,
        COUNT(f.id) as filmography_count,
        ts_rank(a.search_vector, plainto_tsquery($1)) as relevance_score
      FROM actors a
      LEFT JOIN filmography f ON a.id = f.actor_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY a.id
      ORDER BY relevance_score DESC, a.popularity_score DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(query.limit || 20, query.offset || 0);

    return { sql, params };
  }
}
```

### 4.2 Frontend Error Handling

#### Error Boundaries

```typescript
// packages/ui/src/components/error-boundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ComponentType<{ error: Error; retry: () => void }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    // Report to error tracking service
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Send to error tracking service (Sentry, etc.)
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      });
    }
  };

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;

      if (Fallback && this.state.error) {
        return <Fallback error={this.state.error} retry={this.retry} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-gray-900 text-center mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-600 text-center mb-4">
              We encountered an unexpected error. Please try again.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={this.retry}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage example
export const AppErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary fallback={ErrorFallback}>
    {children}
  </ErrorBoundary>
);

const ErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="p-4">
    <div className="bg-red-50 border border-red-200 rounded-md p-4">
      <h3 className="text-red-800 font-medium mb-2">Component Error</h3>
      <p className="text-red-600 text-sm mb-3">{error.message}</p>
      <button
        onClick={retry}
        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
      >
        Retry
      </button>
    </div>
  </div>
);
```

#### API Error Handling

```typescript
// packages/ui/src/hooks/use-api-error.ts
export const useAPIError = () => {
  const [error, setError] = useState<APIError | null>(null);

  const handleError = useCallback((error: any) => {
    console.error('API Error:', error);

    if (error.response) {
      // Server responded with error status
      const apiError = error.response.data.error;
      setError({
        code: apiError.code || 'UNKNOWN_ERROR',
        message: apiError.message || 'An unexpected error occurred',
        details: apiError.details,
        timestamp: apiError.timestamp || new Date().toISOString(),
      });
    } else if (error.request) {
      // Network error
      setError({
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to server. Please check your internet connection.',
        timestamp: new Date().toISOString(),
      });
    } else {
      // Other error
      setError({
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
};

// API client with error handling
// packages/ui/src/services/api-client.ts
export class APIClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = process.env.API_BASE_URL || '/api/v1';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      ...this.defaultHeaders,
      ...options.headers,
    };

    // Add request ID for tracking
    const requestId = generateRequestId();
    headers['X-Request-ID'] = requestId;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      // Log detailed error information
      console.error('API request failed:', {
        url,
        method: options.method || 'GET',
        requestId,
        error: error.message,
        stack: error.stack,
      });

      throw error;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<APIResponse<T>> {
    const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint;
    return this.request<T>(url);
  }

  async post<T>(endpoint: string, data?: any): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}
```

---

## 5. Testing Strategy & Standards

### 5.1 Testing Architecture

#### Test Organization

```typescript
// Root test configuration
// tests/setup.ts
import { beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import { DatabaseManager } from '../packages/database/src/connection-pool';

// Global test database
let testDatabase: DatabaseManager;

beforeAll(async () => {
  // Setup test database
  testDatabase = new DatabaseManager({
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5433'),
    database: process.env.TEST_DB_NAME || 'iknow_test',
    user: process.env.TEST_DB_USER || 'test_user',
    password: process.env.TEST_DB_PASSWORD || 'test_password',
  });

  // Run migrations
  await testDatabase.runMigrations();

  // Set global timeout
  jest.setTimeout(30000);
});

afterAll(async () => {
  // Cleanup test database
  if (testDatabase) {
    await testDatabase.close();
  }
});

beforeEach(async () => {
  // Clear database before each test
  await testDatabase.clearAllTables();
});

afterEach(() => {
  // Cleanup any remaining test data
});

// Test utilities
export const createTestActor = async (overrides: Partial<Actor> = {}): Promise<Actor> => {
  const actorData = {
    name: 'Test Actor',
    bio: 'Test actor bio',
    birthDate: '1980-01-01',
    knownFor: ['Test Movie'],
    ...overrides,
  };

  const result = await testDatabase.query(
    'INSERT INTO actors (name, bio, birth_date, known_for) VALUES ($1, $2, $3, $4) RETURNING *',
    [actorData.name, actorData.bio, actorData.birthDate, actorData.knownFor],
  );

  return result.rows[0];
};

export const createTestUser = async (overrides: Partial<User> = {}): Promise<User> => {
  const userData = {
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: await hashPassword('testpassword123'),
    ...overrides,
  };

  const result = await testDatabase.query(
    'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING *',
    [userData.email, userData.username, userData.passwordHash],
  );

  return result.rows[0];
};
```

#### Unit Testing Standards

```typescript
// packages/database/src/tests/actor-model.test.ts
import { describe, it, expect, beforeEach } from 'bun:test';
import { ActorModel } from '../actor-model';
import { testDatabase } from '../../../tests/setup';

describe('ActorModel', () => {
  let actorModel: ActorModel;

  beforeEach(() => {
    actorModel = new ActorModel(testDatabase);
  });

  describe('findById', () => {
    it('should return actor when found', async () => {
      // Arrange
      const testActor = await createTestActor({ name: 'Tom Hanks' });

      // Act
      const result = await actorModel.findById(testActor.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Tom Hanks');
      expect(result!.id).toBe(testActor.id);
    });

    it('should return null when actor not found', async () => {
      // Act
      const result = await actorModel.findById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });

    it('should throw error for invalid UUID', async () => {
      // Act & Assert
      await expect(actorModel.findById('invalid-uuid')).rejects.toThrow(ValidationError);
    });
  });

  describe('search', () => {
    it('should return actors matching search query', async () => {
      // Arrange
      await createTestActor({ name: 'Tom Hanks', knownFor: ['Forrest Gump'] });
      await createTestActor({ name: 'Tom Cruise', knownFor: ['Top Gun'] });
      await createTestActor({ name: 'Will Smith', knownFor: ['Men in Black'] });

      // Act
      const result = await actorModel.search({
        query: 'Tom',
        limit: 10,
        offset: 0,
      });

      // Assert
      expect(result.actors).toHaveLength(2);
      expect(result.actors.map(a => a.name)).toContain('Tom Hanks');
      expect(result.actors.map(a => a.name)).toContain('Tom Cruise');
      expect(result.actors.map(a => a.name)).not.toContain('Will Smith');
    });

    it('should handle pagination correctly', async () => {
      // Arrange
      for (let i = 0; i < 15; i++) {
        await createTestActor({ name: `Actor ${i}` });
      }

      // Act
      const page1 = await actorModel.search({ query: 'Actor', limit: 10, offset: 0 });
      const page2 = await actorModel.search({ query: 'Actor', limit: 10, offset: 10 });

      // Assert
      expect(page1.actors).toHaveLength(10);
      expect(page2.actors).toHaveLength(5);
      expect(page1.hasMore).toBe(true);
      expect(page2.hasMore).toBe(false);
    });

    it('should return empty results for no matches', async () => {
      // Act
      const result = await actorModel.search({
        query: 'NonExistentActor',
        limit: 10,
        offset: 0,
      });

      // Assert
      expect(result.actors).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
```

#### Integration Testing

```typescript
// tests/integration/actor-api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { APIClient } from '../packages/ui/src/services/api-client';

describe('Actor API Integration Tests', () => {
  let apiClient: APIClient;
  let testActorId: string;

  beforeAll(async () => {
    apiClient = new APIClient();

    // Create test data
    const testActor = await createTestActor({
      name: 'Integration Test Actor',
      bio: 'Actor created for integration testing',
      knownFor: ['Test Movie', 'Another Test Movie'],
    });
    testActorId = testActor.id;
  });

  describe('GET /api/v1/actors/:id', () => {
    it('should return actor details', async () => {
      const response = await apiClient.get(`/actors/${testActorId}`);

      expect(response.error).toBeUndefined();
      expect(response.data).toBeDefined();
      expect(response.data.id).toBe(testActorId);
      expect(response.data.name).toBe('Integration Test Actor');
      expect(response.data.knownFor).toContain('Test Movie');
    });

    it('should return 404 for non-existent actor', async () => {
      const response = await fetch(`${apiClient.baseURL}/actors/non-existent-id`);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe('ACTOR_NOT_FOUND');
    });

    it('should validate actor ID format', async () => {
      const response = await fetch(`${apiClient.baseURL}/actors/invalid-id`);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/actors/search', () => {
    it('should search actors successfully', async () => {
      const response = await apiClient.get('/actors/search', {
        q: 'Integration Test',
        limit: 10,
      });

      expect(response.error).toBeUndefined();
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toBeGreaterThan(0);
      expect(response.data[0].name).toContain('Integration Test');
    });

    it('should handle pagination', async () => {
      // Create multiple test actors
      for (let i = 0; i < 25; i++) {
        await createTestActor({ name: `Search Test Actor ${i}` });
      }

      const page1 = await apiClient.get('/actors/search', {
        q: 'Search Test',
        limit: 10,
        offset: 0,
      });

      const page2 = await apiClient.get('/actors/search', {
        q: 'Search Test',
        limit: 10,
        offset: 10,
      });

      expect(page1.data).toHaveLength(10);
      expect(page2.data).toHaveLength(10);
      expect(page1.pagination.hasMore).toBe(true);
      expect(page2.pagination.hasMore).toBe(true);
    });

    it('should validate search parameters', async () => {
      const response = await fetch(`${apiClient.baseURL}/actors/search?q=`);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

#### E2E Testing

```typescript
// tests/e2e/actor-identification.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Actor Identification Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should identify actor from search', async ({ page }) => {
    // Search for actor
    await page.fill('[data-testid="search-input"]', 'Tom Hanks');
    await page.click('[data-testid="search-button"]');

    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]');

    // Verify search results
    const results = page.locator('[data-testid="actor-card"]');
    await expect(results.first()).toBeVisible();
    await expect(results.first()).toContainText('Tom Hanks');

    // Click on first result
    await results.first().click();

    // Verify actor profile page
    await expect(page.locator('[data-testid="actor-profile"]')).toBeVisible();
    await expect(page.locator('[data-testid="actor-name"]')).toContainText('Tom Hanks');
    await expect(page.locator('[data-testid="actor-filmography"]')).toBeVisible();
  });

  test('should handle search with no results', async ({ page }) => {
    // Search for non-existent actor
    await page.fill('[data-testid="search-input"]', 'NonExistentActor12345');
    await page.click('[data-testid="search-button"]');

    // Verify no results message
    await expect(page.locator('[data-testid="no-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="no-results"]')).toContainText('No actors found');
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Focus search input
    await page.focus('[data-testid="search-input"]');

    // Type search query
    await page.keyboard.type('Tom');

    // Navigate results with keyboard
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // Should navigate to first result
    await expect(page.locator('[data-testid="actor-profile"]')).toBeVisible();
  });

  test('should work on mobile devices', async ({ page }) => {
    // Emulate mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify mobile layout
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible();

    // Perform search on mobile
    await page.tap('[data-testid="search-input"]');
    await page.fill('[data-testid="search-input"]', 'Tom Hanks');
    await page.tap('[data-testid="search-button"]');

    // Verify mobile search results
    await expect(page.locator('[data-testid="mobile-search-results"]')).toBeVisible();
    const results = page.locator('[data-testid="mobile-actor-card"]');
    await expect(results.first()).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network offline
    await page.context().setOffline(true);

    // Attempt search
    await page.fill('[data-testid="search-input"]', 'Tom Hanks');
    await page.click('[data-testid="search-button"]');

    // Verify error message
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="network-error"]')).toContainText('connection');

    // Restore connection and retry
    await page.context().setOffline(false);
    await page.click('[data-testid="retry-button"]');

    // Verify successful search
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  });
});
```

### 5.2 Performance Testing

#### Load Testing Configuration

```typescript
// tests/performance/load-test.ts
import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'], // Less than 1% failures
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Test actor search endpoint
  const searchResponse = http.get(`${BASE_URL}/api/v1/actors/search?q=Tom&limit=20`);

  check(searchResponse, {
    'search status is 200': r => r.status === 200,
    'search response time < 500ms': r => r.timings.duration < 500,
    'search returns data': r => JSON.parse(r.body).data !== undefined,
  });

  // Test actor details endpoint
  const actorId = 'test-actor-id'; // Use known test actor
  const detailsResponse = http.get(`${BASE_URL}/api/v1/actors/${actorId}`);

  check(detailsResponse, {
    'details status is 200': r => r.status === 200,
    'details response time < 500ms': r => r.timings.duration < 500,
    'details returns actor data': r => JSON.parse(r.body).data !== undefined,
  });

  sleep(1);
}
```

---

## 6. Security Implementation

### 6.1 Authentication & Authorization

#### JWT Implementation

```typescript
// packages/utils/src/auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  subscriptionTier: string;
  iat?: number;
  exp?: number;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  static generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
  }

  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new APIError('TOKEN_EXPIRED', 'Token has expired', 401);
      } else if (error.name === 'JsonWebTokenError') {
        throw new APIError('INVALID_TOKEN', 'Invalid token', 401);
      } else {
        throw new APIError('AUTH_ERROR', 'Authentication error', 401);
      }
    }
  }

  static generatePasswordResetToken(): string {
    const bytes = crypto.randomBytes(32);
    return bytes.toString('hex');
  }

  static generateEmailVerificationToken(): string {
    const bytes = crypto.randomBytes(32);
    return bytes.toString('hex');
  }
}

// Authentication middleware
export const authMiddleware = (app: Elysia) =>
  app.derive(async ({ request, set }) => {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      set.status = 401;
      throw new APIError('UNAUTHORIZED', 'Authentication required', 401);
    }

    try {
      const payload = AuthService.verifyToken(token);
      return { user: payload };
    } catch (error) {
      set.status = 401;
      throw error;
    }
  });

// Role-based authorization middleware
export const requireSubscription = (requiredTier: string) => (app: Elysia) =>
  app.derive(({ user, set }) => {
    if (!user || !hasRequiredSubscription(user.subscriptionTier, requiredTier)) {
      set.status = 403;
      throw new APIError('SUBSCRIPTION_REQUIRED', 'Premium subscription required', 403);
    }
    return { user };
  });

function hasRequiredSubscription(userTier: string, requiredTier: string): boolean {
  const tiers = { free: 0, premium: 1, family: 2 };
  return tiers[userTier] >= tiers[requiredTier];
}
```

#### Rate Limiting

```typescript
// packages/utils/src/rate-limiter.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: 'rl:',
    }),
    windowMs: options.windowMs,
    max: options.max,
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: options.message || 'Too many requests, please try again later',
        timestamp: new Date().toISOString(),
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    keyGenerator: req => {
      // Use IP + user ID for authenticated users
      const user = (req as any).user;
      const ip = req.ip || req.connection.remoteAddress;
      return user ? `user:${user.userId}` : `ip:${ip}`;
    },
  });
};

// Rate limiting configurations
export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again in 15 minutes',
});

export const searchRateLimit = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 searches per minute
  message: 'Too many search requests, please try again in a minute',
});

export const generalRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes
  message: 'Too many requests, please try again later',
});
```

### 6.2 Input Validation & Sanitization

#### Validation Schemas

```typescript
// packages/utils/src/validation.ts
import { z } from 'zod';

// Common validation schemas
export const UUIDSchema = z.string().uuid('Invalid UUID format');

export const EmailSchema = z
  .string()
  .email('Invalid email address')
  .max(255, 'Email address too long');

export const UsernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be less than 30 characters')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores, and hyphens',
  );

export const PasswordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Actor-related schemas
export const ActorSearchSchema = z.object({
  q: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query too long')
    .transform(val => val.trim()),
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
  offset: z.coerce
    .number()
    .int('Offset must be an integer')
    .min(0, 'Offset cannot be negative')
    .default(0),
  type: z.enum(['movie', 'series', 'all']).default('all'),
  year: z.coerce
    .number()
    .int('Year must be an integer')
    .min(1888, 'Invalid year')
    .max(new Date().getFullYear() + 5, 'Year cannot be in the distant future')
    .optional(),
  sortBy: z.enum(['relevance', 'name', 'popularity', 'year']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// User registration schema
export const UserRegistrationSchema = z.object({
  email: EmailSchema,
  username: UsernameSchema,
  password: PasswordSchema,
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms of service'),
});

// User update schema
export const UserUpdateSchema = z.object({
  username: UsernameSchema.optional(),
  preferences: z
    .object({
      notifications: z
        .object({
          newContentAlerts: z.boolean().default(true),
          actorUpdates: z.boolean().default(true),
          emailDigest: z.enum(['daily', 'weekly', 'monthly', 'never']).default('weekly'),
          pushNotifications: z.boolean().default(false),
        })
        .optional(),
      privacy: z
        .object({
          profileVisibility: z.enum(['public', 'private']).default('public'),
          shareViewingHistory: z.boolean().default(false),
          allowRecommendations: z.boolean().default(true),
        })
        .optional(),
      discovery: z
        .object({
          preferredGenres: z.array(z.string()).default([]),
          preferredDecades: z.array(z.number()).default([]),
          avoidSpoilers: z.boolean().default(true),
          autoDetect: z.boolean().default(true),
        })
        .optional(),
      ui: z
        .object({
          theme: z.enum(['light', 'dark', 'auto']).default('auto'),
          language: z.string().length(2).default('en'),
          compactMode: z.boolean().default(false),
          showRatings: z.boolean().default(true),
        })
        .optional(),
    })
    .optional(),
});

// Validation middleware factory
export const validateInput = <T>(schema: z.ZodSchema<T>) => {
  return (data: unknown): T => {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          received: err.received,
        }));

        throw new ValidationError('Validation failed', 'validation', fieldErrors);
      }
      throw error;
    }
  };
};
```

#### SQL Injection Prevention

```typescript
// packages/database/src/sql-security.ts
export class SecureQueryBuilder {
  // Only allow whitelisted columns and tables
  private static readonly ALLOWED_TABLES = new Set([
    'actors',
    'users',
    'content',
    'filmography',
    'viewing_history',
    'watchlist',
  ]);

  private static readonly ALLOWED_COLUMNS = new Set([
    'id',
    'name',
    'email',
    'username',
    'bio',
    'birth_date',
    'photo_url',
    'imdb_id',
    'known_for',
    'popularity_score',
    'created_at',
    'updated_at',
  ]);

  static buildSecureSelect(
    table: string,
    columns: string[],
    conditions: Record<string, any> = {},
    orderBy?: string,
    limit?: number,
    offset?: number,
  ): { sql: string; params: any[] } {
    // Validate table name
    if (!this.ALLOWED_TABLES.has(table)) {
      throw new ValidationError('Invalid table name', 'table', table);
    }

    // Validate column names
    const validColumns = columns.filter(col => this.ALLOWED_COLUMNS.has(col));
    if (validColumns.length === 0) {
      throw new ValidationError('No valid columns specified', 'columns', columns);
    }

    let sql = `SELECT ${validColumns.join(', ')} FROM ${table}`;
    const params: any[] = [];
    let paramIndex = 1;

    // Add WHERE conditions safely
    if (Object.keys(conditions).length > 0) {
      const whereConditions: string[] = [];

      for (const [column, value] of Object.entries(conditions)) {
        if (!this.ALLOWED_COLUMNS.has(column)) {
          continue; // Skip invalid columns
        }

        if (Array.isArray(value)) {
          whereConditions.push(`${column} = ANY($${paramIndex})`);
          params.push(value);
        } else {
          whereConditions.push(`${column} = $${paramIndex}`);
          params.push(value);
        }
        paramIndex++;
      }

      if (whereConditions.length > 0) {
        sql += ` WHERE ${whereConditions.join(' AND ')}`;
      }
    }

    // Add ORDER BY safely
    if (orderBy) {
      const [column, direction] = orderBy.split(' ');
      if (this.ALLOWED_COLUMNS.has(column) && ['ASC', 'DESC'].includes(direction?.toUpperCase())) {
        sql += ` ORDER BY ${column} ${direction.toUpperCase()}`;
      }
    }

    // Add LIMIT and OFFSET
    if (limit !== undefined) {
      sql += ` LIMIT $${paramIndex}`;
      params.push(limit);
      paramIndex++;
    }

    if (offset !== undefined) {
      sql += ` OFFSET $${paramIndex}`;
      params.push(offset);
    }

    return { sql, params };
  }

  // Full-text search with safe query building
  static buildSearchQuery(
    searchTerm: string,
    table: string,
    searchColumn: string,
    additionalConditions: Record<string, any> = {},
  ): { sql: string; params: any[] } {
    // Validate inputs
    if (!this.ALLOWED_TABLES.has(table)) {
      throw new ValidationError('Invalid table name', 'table', table);
    }

    if (!this.ALLOWED_COLUMNS.has(searchColumn)) {
      throw new ValidationError('Invalid search column', 'searchColumn', searchColumn);
    }

    // Sanitize search term
    const cleanSearchTerm = searchTerm
      .replace(/[^a-zA-Z0-9\s\-']/g, '')
      .trim()
      .substring(0, 100);

    if (cleanSearchTerm.length === 0) {
      throw new ValidationError('Invalid search term', 'searchTerm', searchTerm);
    }

    let sql = `
      SELECT *,
             ts_rank(${searchColumn}, plainto_tsquery('english', $1)) as relevance_score
      FROM ${table}
      WHERE ${searchColumn} @@ plainto_tsquery('english', $1)
    `;

    const params: any[] = [cleanSearchTerm];
    let paramIndex = 2;

    // Add additional conditions
    for (const [column, value] of Object.entries(additionalConditions)) {
      if (this.ALLOWED_COLUMNS.has(column)) {
        sql += ` AND ${column} = $${paramIndex}`;
        params.push(value);
        paramIndex++;
      }
    }

    sql += ` ORDER BY relevance_score DESC`;

    return { sql, params };
  }
}
```

---

## 7. Deployment & Infrastructure

### 7.1 Container Configuration

#### Multi-stage Dockerfile

```dockerfile
# apps/api/Dockerfile
FROM oven/bun:1.3.1-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# Build application
FROM base AS builder
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# Production image
FROM base AS runner
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 bunuser

USER bunuser

EXPOSE 3000
ENV NODE_ENV=production

CMD ["bun", "dist/index.js"]
```

```dockerfile
# apps/web/Dockerfile
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb ./
RUN npm ci --only=production

# Build application
FROM base AS builder
COPY package.json bun.lockb ./
RUN npm ci
COPY . .
RUN npm run build

# Production image with nginx
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose for Development

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:18-alpine
    environment:
      POSTGRES_DB: iknow_dev
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_password
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./packages/database/src/migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U dev_user -d iknow_dev']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://dev_user:dev_password@postgres:5432/iknow_dev
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev_jwt_secret_key_change_in_production
      NODE_ENV: development
    ports:
      - '3000:3000'
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./apps/api/src:/app/src
    command: bun run dev

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    environment:
      API_BASE_URL: http://api:3000/api/v1
    ports:
      - '4321:80'
    depends_on:
      - api
    volumes:
      - ./apps/web/src:/app/src
      - ./apps/web/public:/app/public

  scraper:
    build:
      context: ./apps/scraper
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://dev_user:dev_password@postgres:5432/iknow_dev
      REDIS_URL: redis://redis:6379
      NODE_ENV: development
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./apps/scraper/src:/app/src
    command: bun run dev

volumes:
  postgres_data:
  redis_data:
```

### 7.2 Production Deployment

#### Kubernetes Configuration

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: iknow

---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: iknow-config
  namespace: iknow
data:
  NODE_ENV: 'production'
  API_BASE_URL: 'https://api.iknow.app/api/v1'
  REDIS_HOST: 'redis-service'
  DB_HOST: 'postgres-service'

---
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: iknow-secrets
  namespace: iknow
type: Opaque
data:
  DATABASE_URL: <base64-encoded-database-url>
  JWT_SECRET: <base64-encoded-jwt-secret>
  REDIS_PASSWORD: <base64-encoded-redis-password>

---
# k8s/postgres.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: iknow
spec:
  serviceName: postgres-service
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:18-alpine
          env:
            - name: POSTGRES_DB
              value: iknow_prod
            - name: POSTGRES_USER
              valueFrom:
                secretKeyRef:
                  name: iknow-secrets
                  key: DB_USER
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: iknow-secrets
                  key: DB_PASSWORD
          ports:
            - containerPort: 5432
          volumeMounts:
            - name: postgres-storage
              mountPath: /var/lib/postgresql/data
          resources:
            requests:
              memory: '1Gi'
              cpu: '500m'
            limits:
              memory: '2Gi'
              cpu: '1000m'
          livenessProbe:
            exec:
              command:
                - pg_isready
                - -U
                - $(POSTGRES_USER)
                - -d
                - $(POSTGRES_DB)
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            exec:
              command:
                - pg_isready
                - -U
                - $(POSTGRES_USER)
                - -d
                - $(POSTGRES_DB)
            initialDelaySeconds: 5
            periodSeconds: 5
  volumeClaimTemplates:
    - metadata:
        name: postgres-storage
      spec:
        accessModes: ['ReadWriteOnce']
        resources:
          requests:
            storage: 20Gi

---
# k8s/api.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: iknow
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: iknow/api:latest
          envFrom:
            - configMapRef:
                name: iknow-config
            - secretRef:
                name: iknow-secrets
          ports:
            - containerPort: 3000
          resources:
            requests:
              memory: '256Mi'
              cpu: '250m'
            limits:
              memory: '512Mi'
              cpu: '500m'
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
          lifecycle:
            preStop:
              exec:
                command: ['/bin/sh', '-c', 'sleep 15']

---
# k8s/web.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  namespace: iknow
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: iknow/web:latest
          ports:
            - containerPort: 80
          resources:
            requests:
              memory: '128Mi'
              cpu: '100m'
            limits:
              memory: '256Mi'
              cpu: '200m'
          livenessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 5

---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: iknow-ingress
  namespace: iknow
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: '100'
    nginx.ingress.kubernetes.io/rate-limit-window: '1m'
spec:
  tls:
    - hosts:
        - iknow.app
        - api.iknow.app
      secretName: iknow-tls
  rules:
    - host: iknow.app
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-service
                port:
                  number: 80
    - host: api.iknow.app
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-service
                port:
                  number: 3000
```

### 7.3 CI/CD Pipeline

#### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Run linting
        run: bun run lint

      - name: Run type checking
        run: bun run type-check

      - name: Run unit tests
        run: bun run test:unit

      - name: Run integration tests
        run: bun run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    strategy:
      matrix:
        service: [api, web, scraper]

    steps:
      - uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/${{ matrix.service }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./apps/${{ matrix.service }}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment"
          # Add deployment commands here
          # kubectl apply -f k8s/ -n iknow-staging
          # kubectl set image deployment/api api=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/api:${{ github.sha }} -n iknow-staging
          # kubectl set image deployment/web web=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/web:${{ github.sha }} -n iknow-staging

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to production
        run: |
          echo "Deploying to production environment"
          # Add production deployment commands here
          # kubectl apply -f k8s/ -n iknow
          # kubectl set image deployment/api api=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/api:${{ github.sha }} -n iknow
          # kubectl set image deployment/web web=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/web:${{ github.sha }} -n iknow

  e2e-tests:
    needs: deploy-staging
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Playwright
        run: npm ci
        working-directory: ./tests/e2e

      - name: Install Playwright browsers
        run: npx playwright install --with-deps
        working-directory: ./tests/e2e

      - name: Run E2E tests
        run: npx playwright test
        working-directory: ./tests/e2e
        env:
          BASE_URL: https://staging.iknow.app

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: ./tests/e2e/playwright-report/
```

---

## 8. Monitoring & Observability

### 8.1 Application Monitoring

#### Health Checks

```typescript
// apps/api/src/routes/health.ts
export const healthCheckRoute = (app: Elysia) =>
  app.get('/health', async () => {
    const startTime = Date.now();

    const checks = await Promise.allSettled([
      checkDatabase(),
      checkRedis(),
      checkExternalAPIs(),
      checkDiskSpace(),
      checkMemoryUsage(),
    ]);

    const results = checks.map((check, index) => {
      const checkNames = ['database', 'redis', 'external_apis', 'disk_space', 'memory'];
      return {
        name: checkNames[index],
        status: check.status,
        ...(check.status === 'rejected' && {
          error: check.reason.message,
          timestamp: new Date().toISOString(),
        }),
      };
    });

    const overallStatus = checks.every(c => c.status === 'fulfilled') ? 'healthy' : 'degraded';
    const responseTime = Date.now() - startTime;

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime,
      checks: results,
      version: process.env.APP_VERSION || '1.0.0',
      uptime: process.uptime(),
    };
  });

async function checkDatabase(): Promise<void> {
  const db = new DatabaseManager();
  await db.query('SELECT 1');
}

async function checkRedis(): Promise<void> {
  const redis = new Redis(process.env.REDIS_URL);
  await redis.ping();
  await redis.quit();
}

async function checkExternalAPIs(): Promise<void> {
  // Check critical external APIs
  const response = await fetch('https://api.example.com/health', {
    timeout: 5000,
  });

  if (!response.ok) {
    throw new Error(`External API returned ${response.status}`);
  }
}

async function checkDiskSpace(): Promise<void> {
  const fs = require('fs');
  const stats = fs.statSync('/');
  const free = stats.bfree;
  const total = stats.blocks;
  const freePercent = (free / total) * 100;

  if (freePercent < 10) {
    throw new Error(`Low disk space: ${freePercent.toFixed(2)}% free`);
  }
}

async function checkMemoryUsage(): Promise<void> {
  const usage = process.memoryUsage();
  const totalMemory = require('os').totalmem();
  const usedMemory = usage.heapUsed;
  const memoryPercent = (usedMemory / totalMemory) * 100;

  if (memoryPercent > 90) {
    throw new Error(`High memory usage: ${memoryPercent.toFixed(2)}%`);
  }
}
```

#### Metrics Collection

```typescript
// packages/utils/src/metrics.ts
import prometheus from 'prom-client';

// Create metrics registry
const register = new prometheus.Registry();

// Default metrics
prometheus.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

export const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const activeConnections = new prometheus.Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections',
});

export const databaseQueryDuration = new prometheus.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

export const searchQueries = new prometheus.Counter({
  name: 'search_queries_total',
  help: 'Total number of search queries',
  labelNames: ['query_type', 'results_count'],
});

export const cacheHits = new prometheus.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
});

export const cacheMisses = new prometheus.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);
register.registerMetric(databaseQueryDuration);
register.registerMetric(searchQueries);
register.registerMetric(cacheHits);
register.registerMetric(cacheMisses);

// Middleware to track HTTP metrics
export const metricsMiddleware = (app: Elysia) =>
  app
    .onRequest(({ request }) => {
      request.start = Date.now();
    })
    .onResponse(({ request, set }) => {
      const duration = (Date.now() - (request.start || Date.now())) / 1000;
      const route = extractRoute(request);
      const method = request.method;
      const statusCode = set.status || 200;

      httpRequestDuration.labels(method, route, statusCode.toString()).observe(duration);

      httpRequestTotal.labels(method, route, statusCode.toString()).inc();
    });

function extractRoute(request: Request): string {
  // Extract route pattern from request URL
  const url = new URL(request.url);
  return url.pathname.replace(/\/[a-f0-9-]{36}/g, '/:id'); // Replace UUIDs with :id
}

// Metrics endpoint
export const metricsRoute = (app: Elysia) =>
  app.get('/metrics', async ({ set }) => {
    set.headers['Content-Type'] = register.contentType;
    return await register.metrics();
  });
```

### 8.2 Logging Configuration

#### Structured Logging

```typescript
// packages/utils/src/logger.ts
import winston from 'winston';
import 'winston-daily-rotate-file';

// Custom format for structured logging
const customFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta,
      service: process.env.SERVICE_NAME || 'iknow-api',
      version: process.env.APP_VERSION || '1.0.0',
    });
  }),
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'iknow-api',
  },
  transports: [
    // Error log file
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    }),

    // Combined log file
    new winston.transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    }),

    // Console output for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
        }),
      ),
    }),
  ],
});

// Request logging middleware
export const requestLogger = (app: Elysia) =>
  app.derive(({ request }) => {
    const start = Date.now();
    const requestId = generateRequestId();

    // Log request start
    logger.info('Request started', {
      requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    });

    return {
      requestId,
      logRequest: (data: any) => {
        logger.info('Request data', { requestId, ...data });
      },
      logError: (error: Error, data: any) => {
        logger.error('Request error', {
          requestId,
          error: error.message,
          stack: error.stack,
          ...data,
        });
      },
      logResponse: (statusCode: number, data: any) => {
        const duration = Date.now() - start;

        logger.info('Request completed', {
          requestId,
          statusCode,
          duration,
          ...data,
        });
      },
    };
  });

// Service-specific logger helper
export class ServiceLogger {
  constructor(private serviceName: string) {}

  info(message: string, meta: any = {}) {
    logger.info(message, { service: this.serviceName, ...meta });
  }

  error(message: string, error?: Error, meta: any = {}) {
    logger.error(message, {
      service: this.serviceName,
      ...(error && { error: error.message, stack: error.stack }),
      ...meta,
    });
  }

  warn(message: string, meta: any = {}) {
    logger.warn(message, { service: this.serviceName, ...meta });
  }

  debug(message: string, meta: any = {}) {
    logger.debug(message, { service: this.serviceName, ...meta });
  }

  // Performance logging
  timer<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    this.debug(`Starting ${operation}`);

    return fn().then(
      result => {
        const duration = Date.now() - start;
        this.info(`Completed ${operation}`, { duration });
        return result;
      },
      error => {
        const duration = Date.now() - start;
        this.error(`Failed ${operation}`, error, { duration });
        throw error;
      },
    );
  }
}

// Usage example
const actorLogger = new ServiceLogger('ActorService');
export class ActorService {
  async getActor(id: string) {
    return actorLogger.timer('getActor', async () => {
      // Implementation
    });
  }
}
```

---

## 9. Implementation Guidelines

### 9.1 Development Standards

#### Code Quality Checklist

- [ ] TypeScript strict mode enabled
- [ ] No `any` types used
- [ ] All public methods have JSDoc comments
- [ ] Error handling implemented for all async operations
- [ ] Input validation on all API endpoints
- [ ] Unit tests for all business logic
- [ ] Integration tests for API endpoints
- [ ] Performance benchmarks for critical paths
- [ ] Security review completed
- [ ] Accessibility compliance verified

#### Git Workflow

```bash
# Feature branch naming
feature/user-authentication
feature/actor-search-optimization
feature/mobile-pwa-support

# Commit message format
feat: add user authentication with JWT
fix: resolve actor search performance issue
docs: update API documentation
test: add integration tests for actor endpoints
refactor: optimize database query patterns
chore: update dependencies

# Example commit messages
feat(auth): implement JWT-based authentication system
- Add login/register endpoints
- Implement token refresh mechanism
- Add password validation and hashing
- Create auth middleware for protected routes

fix(search): resolve timeout issues in actor search
- Add database connection pooling
- Implement query optimization
- Add caching layer for frequent searches
- Fix memory leak in search service

test(api): add comprehensive integration tests
- Test all actor endpoints
- Add error scenario coverage
- Implement test data factories
- Add performance benchmarks
```

### 9.2 Performance Monitoring

#### Key Performance Indicators (KPIs)

- **API Response Time**: 95th percentile < 500ms
- **Database Query Time**: 95th percentile < 100ms
- **Search Response Time**: 95th percentile < 300ms
- **Cache Hit Rate**: > 80% for frequently accessed data
- **Error Rate**: < 0.1% for all endpoints
- **Uptime**: > 99.5% availability
- **Page Load Time**: < 2 seconds for mobile
- **Time to Interactive**: < 3 seconds

#### Alerting Configuration

```typescript
// packages/utils/src/alerting.ts
export class AlertManager {
  static checkPerformanceMetrics(metrics: PerformanceMetrics) {
    const alerts = [];

    // Response time alerts
    if (metrics.apiResponseTime95th > 500) {
      alerts.push({
        severity: 'warning',
        message: 'API response time exceeding 500ms threshold',
        metric: 'api_response_time',
        value: metrics.apiResponseTime95th,
        threshold: 500,
      });
    }

    // Error rate alerts
    if (metrics.errorRate > 0.001) {
      // 0.1%
      alerts.push({
        severity: 'critical',
        message: 'Error rate exceeding 0.1% threshold',
        metric: 'error_rate',
        value: metrics.errorRate,
        threshold: 0.001,
      });
    }

    // Database performance alerts
    if (metrics.dbQueryTime95th > 100) {
      alerts.push({
        severity: 'warning',
        message: 'Database query time exceeding 100ms threshold',
        metric: 'db_query_time',
        value: metrics.dbQueryTime95th,
        threshold: 100,
      });
    }

    // Cache hit rate alerts
    if (metrics.cacheHitRate < 0.8) {
      // 80%
      alerts.push({
        severity: 'warning',
        message: 'Cache hit rate below 80% threshold',
        metric: 'cache_hit_rate',
        value: metrics.cacheHitRate,
        threshold: 0.8,
      });
    }

    // Send alerts
    alerts.forEach(alert => this.sendAlert(alert));
  }

  private static async sendAlert(alert: Alert) {
    // Send to monitoring system (PagerDuty, Slack, etc.)
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;

    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 ${alert.severity.toUpperCase()}: ${alert.message}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*${alert.severity.toUpperCase()} Alert*`,
              },
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*Metric:*\n${alert.metric}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Value:*\n${alert.value}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Threshold:*\n${alert.threshold}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Time:*\n${new Date().toISOString()}`,
                },
              ],
            },
          ],
        }),
      });
    }
  }
}
```

---

## 10. Security Best Practices

### 10.1 Data Protection

#### Encryption Standards

```typescript
// packages/utils/src/encryption.ts
import crypto from 'crypto';

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;

  private static getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key || key.length !== 64) {
      // 64 hex chars = 32 bytes
      throw new Error('Invalid encryption key');
    }
    return Buffer.from(key, 'hex');
  }

  static encrypt(text: string): string {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(this.IV_LENGTH);

    const cipher = crypto.createCipher(this.ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Combine iv + encrypted + tag
    return iv.toString('hex') + ':' + encrypted + ':' + tag.toString('hex');
  }

  static decrypt(encryptedText: string): string {
    const key = this.getEncryptionKey();

    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const tag = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipher(this.ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // For sensitive data at rest
  static encryptSensitiveData(data: any): string {
    const jsonString = JSON.stringify(data);
    return this.encrypt(jsonString);
  }

  static decryptSensitiveData(encryptedData: string): any {
    const decrypted = this.decrypt(encryptedData);
    return JSON.parse(decrypted);
  }
}
```

#### GDPR Compliance

```typescript
// packages/utils/src/gdpr.ts
export class GDPRService {
  // Data retention policies
  static readonly RETENTION_PERIODS = {
    userAccounts: 365 * 7, // 7 years
    viewingHistory: 365 * 2, // 2 years
    searchHistory: 90, // 90 days
    auditLogs: 365 * 10, // 10 years
  };

  // Right to be forgotten
  static async deleteUserAllData(userId: string): Promise<void> {
    const db = new DatabaseManager();

    await db.transaction(async client => {
      // Delete user data in correct order (respecting foreign keys)
      await client.query('DELETE FROM viewing_history WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM watchlist WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
    });

    // Log data deletion for audit purposes
    logger.info('User data deleted (GDPR request)', {
      userId,
      timestamp: new Date().toISOString(),
      reason: 'right_to_be_forgotten',
    });
  }

  // Data export functionality
  static async exportUserData(userId: string): Promise<UserDataExport> {
    const db = new DatabaseManager();

    const [user, viewingHistory, watchlist] = await Promise.all([
      db.query('SELECT * FROM users WHERE id = $1', [userId]),
      db.query('SELECT * FROM viewing_history WHERE user_id = $1 ORDER BY viewed_at DESC', [
        userId,
      ]),
      db.query('SELECT * FROM watchlist WHERE user_id = $1 ORDER BY added_at DESC', [userId]),
    ]);

    return {
      personalData: user.rows[0],
      viewingHistory: viewingHistory.rows,
      watchlist: watchlist.rows,
      exportDate: new Date().toISOString(),
      format: 'json',
    };
  }

  // Anonymize data for analytics
  static anonymizeUserData(userData: any): any {
    return {
      ...userData,
      id: this.hashUserId(userData.id),
      email: null,
      username: null,
      ipAddress: null,
      userAgent: null,
    };
  }

  private static hashUserId(userId: string): string {
    return crypto
      .createHash('sha256')
      .update(userId + process.env.ANONYMIZATION_SALT)
      .digest('hex');
  }
}

interface UserDataExport {
  personalData: any;
  viewingHistory: any[];
  watchlist: any[];
  exportDate: string;
  format: string;
}
```

---

## Conclusion

This technical specification provides comprehensive implementation guidance for the I Know entertainment intelligence platform. It covers all critical aspects of the system including data models, API specifications, performance requirements, security implementation, testing strategies, and deployment configurations.

### Key Implementation Priorities

1. **Performance First**: Implement sub-500ms response times with comprehensive caching and optimization
2. **Security by Design**: Multi-layer security with proper authentication, authorization, and data protection
3. **Mobile-First**: Progressive web applications with offline capabilities
4. **Scalable Architecture**: Service-oriented design supporting 1M+ concurrent users
5. **Comprehensive Testing**: Unit, integration, and E2E tests with performance benchmarks

### Success Metrics

- **Technical Performance**: 95th percentile response times under 500ms
- **System Reliability**: 99.5% uptime with <0.1% error rates
- **User Experience**: <2 second page load times on mobile
- **Development Quality**: 90%+ test coverage with zero critical security vulnerabilities

This specification serves as the authoritative guide for Phase 4 implementation and should be referenced throughout the development process to ensure consistency, quality, and adherence to architectural decisions.

---

**Document Status**: Complete and Ready for Implementation
**Version**: 1.0
**Last Updated**: 2025-10-29
**Next Review**: Upon completion of Phase 4 Epic 1

_Generated using BMad Technical Specification Workflow v1.0_
