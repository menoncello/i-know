# I Know - Decision Architecture

## Executive Summary

I Know is an entertainment intelligence platform that eliminates cognitive friction during content consumption by providing instant actor identification and discovery. The architecture leverages a modern TypeScript monorepo with Bun + Elysia + Astro + PostgreSQL stack, optimized for mobile-first second-screen usage patterns. The system follows a service-oriented approach with independent frontend, backend API, and scraper services communicating through a centralized PostgreSQL database.

## Project Initialization

### Monorepo Setup

**STATER TEMPLATE SELECTION**: Turborepo 2.5.9 chosen for optimized builds and dependency management

**PROVIDED BY TURBOREPO STARTER**:
- Basic monorepo structure with apps/ and packages/ directories
- PNPM workspace configuration
- turbo.json build pipeline configuration
- Build optimization and caching
- Dependency hoisting

**CUSTOM ARCHITECTURAL DECISIONS**:
- Technology stack selection (Bun + Elysia + Astro)
- File organization patterns
- TypeScript strict mode enforcement
- Testing strategy implementation

```bash
# Step 1: Create Turbo monorepo (PROVIDED BY STARTER)
bun create turbo@latest i-know
cd i-know

# Step 2: Setup workspace configuration (PROVIDED BY STARTER)
echo "packages:\n  - 'apps/*'\n  - 'packages/*'" > pnpm-workspace.yaml

# Step 3: Initialize apps with custom technology choices (CUSTOM)
bun create astro@latest apps/web --template blog --typescript strict --tailwind --yes
cd apps/web && bun add @astrojs/react react @types/react
cd ../..

bun create elysia apps/api --typescript
bun init apps/scraper

# Step 4: Setup custom shared packages structure (CUSTOM)
mkdir -p packages/{ui,types,database,utils}

# Step 5: Install dependencies (CUSTOM)
bun install -D turbo @types/node

# Step 6: Configure turbo.json (ENHANCED FROM STARTER)
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".astro/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    }
  }
}
EOF
```

This combines Turborepo's optimized build infrastructure with our custom technology stack and architectural patterns.

## Decision Summary

| Category | Decision | Version | Affects Epics | Rationale |
| -------- | -------- | ------- | ------------- | --------- |
| **Monorepo Management** | Turborepo | 2.5.9 | All | Optimized builds and dependency management (Latest stable as of 2025-10-29) |
| **Frontend Framework** | Astro | 5.12.0 | All | Performance optimized, SEO-friendly, islands architecture (Latest stable as of 2025-10-29) |
| **UI Components** | shadcn/ui | 3.5.0 | All | Modern, accessible, matches rich dashboard design |
| **Backend Framework** | Elysia | 1.4.13 | All | Type-safe, modern, excellent Bun integration (Latest stable as of 2025-10-29) |
| **Runtime** | Bun | 1.3.1 | All | Ultra-fast performance, all-in-one tooling |
| **Database** | PostgreSQL | 18.0 | All | Scalable, reliable, supports complex queries (Latest stable released 2025-09-25) |
| **React Version** | React | 19.2.0 | All | Latest stable version with compiler support |
| **TypeScript** | TypeScript | 5.9.3 | All | Strict mode, latest features, no any types |
| **CSS Framework** | Tailwind CSS | 4.1.16 | All | Modern utility-first framework with v4 improvements |
| **Scraper Technology** | Bun + Puppeteer fallback | 1.3.1 + 23.8.0 | Core Actor Identification | Primary GET method with reliable fallback (Puppeteer 23.8.0 latest stable as of 2025-10-29) |
| **UUID Strategy** | UUID v7 | RFC 4122 | All | Time-ordered, sortable, better performance |
| **Test Strategy** | Co-located tests structure | - | All | Clear separation, better organization |

## Project Structure

```
i-know/
├── apps/
│   ├── web/                           # Astro + React frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ui/                # shadcn/ui components
│   │   │   │   │   ├── actor-card.tsx
│   │   │   │   │   ├── content-banner.tsx
│   │   │   │   │   ├── discovery-grid.tsx
│   │   │   │   │   └── viewing-history.tsx
│   │   │   │   ├── layout/
│   │   │   │   │   ├── header.astro
│   │   │   │   │   ├── footer.astro
│   │   │   │   │   └── mobile-nav.astro
│   │   │   │   └── features/
│   │   │   │       ├── actor-search/
│   │   │   │       ├── discovery/
│   │   │   │       └── preferences/
│   │   │   ├── pages/
│   │   │   │   ├── index.astro         # Home/Discovery
│   │   │   │   ├── search.astro       # Actor search
│   │   │   │   ├── actor/[id].astro   # Actor profile
│   │   │   │   └── profile.astro      # User profile
│   │   │   ├── layouts/
│   │   │   │   ├── base.astro
│   │   │   │   └── mobile.astro
│   │   │   ├── services/
│   │   │   │   ├── api-client.ts
│   │   │   │   ├── storage-service.ts
│   │   │   │   └── search-service.ts
│   │   │   ├── types/
│   │   │   │   └── actor-types.ts
│   │   │   ├── utils/
│   │   │   │   ├── format-utils.ts
│   │   │   │   └── validation.ts
│   │   │   ├── styles/
│   │   │   │   └── globals.css
│   │   │   └── env.d.ts
│   │   ├── tests/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── services/
│   │   ├── public/
│   │   ├── astro.config.mjs
│   │   ├── tailwind.config.mjs
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── bun.lockb
│   ├── api/                           # Elysia backend
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── actors/
│   │   │   │   │   ├── index.ts       # GET /api/v1/actors
│   │   │   │   │   ├── [id].ts        # GET /api/v1/actors/:id
│   │   │   │   │   └── search.ts      # GET /api/v1/actors/search
│   │   │   │   ├── users/
│   │   │   │   │   ├── index.ts       # POST /api/v1/users
│   │   │   │   │   ├── login.ts       # POST /api/v1/users/login
│   │   │   │   │   └── preferences.ts # PUT /api/v1/users/preferences
│   │   │   │   └── health.ts          # GET /api/v1/health
│   │   │   ├── models/
│   │   │   │   ├── actor-model.ts
│   │   │   │   ├── user-model.ts
│   │   │   │   └── viewing-history-model.ts
│   │   │   ├── services/
│   │   │   │   ├── database-service.ts
│   │   │   │   ├── actor-service.ts
│   │   │   │   └── user-service.ts
│   │   │   ├── middleware/
│   │   │   │   ├── cors-middleware.ts
│   │   │   │   ├── error-middleware.ts
│   │   │   │   └── logging-middleware.ts
│   │   │   ├── database/
│   │   │   │   ├── migrations/
│   │   │   │   ├── seeds/
│   │   │   │   └── connection.ts
│   │   │   ├── types/
│   │   │   │   ├── api-types.ts
│   │   │   │   └── database-types.ts
│   │   │   └── utils/
│   │   │       ├── validation.ts
│   │   │       └── error-handling.ts
│   │   ├── tests/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   └── models/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── bun.lockb
│   └── scraper/                       # Bun scraping service
│       ├── src/
│       │   ├── services/
│       │   │   ├── imdb-service.ts     # Revolutionary GET method
│       │   │   ├── puppeteer-service.ts # Fallback scraper
│       │   │   └── data-processor.ts   # Transform and store
│       │   ├── models/
│       │   │   ├── actor-scraped-model.ts
│       │   │   └── content-model.ts
│       │   ├── database/
│       │   │   └── connection.ts       # Shared DB connection
│       │   ├── utils/
│       │   │   ├── rate-limiter.ts
│       │   │   └── retry-logic.ts
│       │   ├── types/
│       │   │   └── scraper-types.ts
│       │   └── scheduler/
│       │       └── cron-jobs.ts        # Daily updates
│       ├── tests/
│       │   ├── services/
│       │   └── integration/
│       ├── package.json
│       ├── tsconfig.json
│       └── bun.lockb
├── packages/
│   ├── ui/                            # Shared shadcn/ui components
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── actor-card/
│   │   │   │   │   ├── actor-card.tsx
│   │   │   │   │   └── actor-card.stories.tsx
│   │   │   │   ├── content-banner/
│   │   │   │   ├── discovery-grid/
│   │   │   │   └── viewing-history/
│   │   │   ├── utils/
│   │   │   │   └── cn.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── types/                         # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── actor-types.ts
│   │   │   ├── user-types.ts
│   │   │   ├── api-types.ts
│   │   │   └── database-types.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── database/                      # Shared database utilities
│   │   ├── src/
│   │   │   ├── connection.ts
│   │   │   ├── migrations/
│   │   │   ├── seeds/
│   │   │   └── schemas/
│   │   │       ├── actor-schema.sql
│   │   │       ├── user-schema.sql
│   │   │       └── viewing-history-schema.sql
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── utils/                         # Shared utilities
│       ├── src/
│       │   ├── logger.ts
│       │   ├── crypto.ts
│       │   ├── date-utils.ts
│       │   └── validation.ts
│       ├── package.json
│       └── tsconfig.json
├── tests/                             # E2E and integration tests
│   ├── e2e/
│   ├── integration/
│   └── performance/
├── docs/                              # Documentation
│   ├── api/
│   ├── deployment/
│   └── user-guides/
├── scripts/                           # Build and deployment scripts
│   ├── build.sh
│   ├── deploy.sh
│   └── database-migrate.sh
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── package.json                       # Root package.json
├── turbo.json                         # Turborepo configuration
├── pnpm-workspace.yaml               # PNPM workspace config
├── tsconfig.json                      # Root TypeScript config
├── .gitignore
├── .env.example
├── README.md
└── bun.lockb
```

## Epic to Architecture Mapping

| Epic | Lives In | Key Components | Integration Points |
|------|-----------|----------------|-------------------|
| **Epic 1: Foundation & Infrastructure** | `apps/api`, `apps/scraper`, packages | Database setup, authentication, CI/CD, monorepo structure | All epics depend on foundation |
| **Epic 2: Core Actor Identification** | `apps/scraper`, `apps/api`, `apps/web` | IMDB service, actor API, search UI, data processing | Core functionality for all features |
| **Epic 3: User Experience & Personalization** | `apps/web`, `apps/api` | User profiles, preferences, watchlist, viewing history | Depends on actor identification |
| **Epic 4: Premium Features & Monetization** | `apps/api`, `apps/web` | Subscriptions, analytics, social features, premium content | Builds on personalization |
| **Epic 5: Scale & Intelligence** | `apps/scraper`, `apps/api` | ML infrastructure, B2B API, advanced analytics, performance optimization | Advanced features on top of all |

### Architecture Decision to Epic Mapping

| Architecture Decision | Primary Epics Affected | Secondary Epics | Implementation Priority |
|----------------------|-----------------------|----------------|------------------------|
| **Turborepo 2.5.9** | Epic 1 | All | Critical - Foundation |
| **Bun 1.3.1 Runtime** | Epic 1, Epic 2 | Epic 5 | Critical - Performance |
| **PostgreSQL 18.0** | Epic 1 | All | Critical - Data Layer |
| **Elysia 1.4.13** | Epic 1, Epic 2 | Epic 3, Epic 4 | Critical - API Foundation |
| **Astro 5.12.0** | Epic 3, Epic 4 | Epic 5 | High - UI Foundation |
| **Puppeteer 23.8.0** | Epic 2 | Epic 5 | High - Data Acquisition |
| **Database-First Architecture** | Epic 1, Epic 2 | All | Critical - Communication Pattern |
| **UUID v7 Strategy** | Epic 1 | All | Medium - Performance Optimization |
| **React 19.2.0** | Epic 3, Epic 4 | Epic 5 | Medium - UI Performance |
| **shadcn/ui 3.5.0** | Epic 3, Epic 4 | - | Medium - UI Consistency |
| **Tailwind CSS 4.1.16** | Epic 3, Epic 4 | - | Low - Styling |
| **Co-located Tests** | Epic 1 | All | Low - Quality Assurance |

## Technology Stack Details

### Core Technologies

**Frontend Stack:**
- **Astro 5.12.0**: Islands architecture, SSR/SSG flexibility, optimized for mobile-first
- **React 19.2.0**: Latest stable version with React Compiler 1.0 support
- **TypeScript 5.9.3**: Strict mode, no `any` types, full type safety with latest features
- **Tailwind CSS 4.1.16**: Latest v4 utility-first styling with improved performance
- **shadcn/ui 3.5.0**: Modern component library built on Radix UI primitives

**Backend Stack:**
- **Bun 1.3.1**: Ultra-fast JavaScript runtime with zero-config frontend development and built-in Redis client
- **Elysia 1.4.13**: Type-safe web framework with excellent TypeScript support
- **PostgreSQL 18.0**: Latest stable version with advanced indexing and performance improvements
- **Prisma 5.22.0**: Type-safe ORM with migrations and schema management

**Scraper Stack:**
- **Bun 1.3.1**: High-performance runtime with unified SQL API for intensive scraping operations
- **Puppeteer 23.8.0**: Latest stable version with Chrome browser support and improved accessibility (verified 2025-10-29)
- **Custom IMDB API**: Revolutionary direct access method (100x faster than scraping)

**Development Stack:**
- **Turborepo 2.5.9**: Monorepo management with intelligent caching and query capabilities
- **PNPM 9.14.4**: Fast, disk-space efficient package management
- **ESLint + Prettier**: Code quality and formatting standards

### Version Compatibility and Breaking Changes

#### React 19.2.0 Breaking Changes Considerations

**New Features Enabled:**
- **React Compiler**: Automatic optimization memoization (available in 19.2.0+)
- **Server Components**: Improved server-side rendering capabilities
- **Concurrent Features**: Enhanced concurrent rendering patterns

**Breaking Changes Impact:**
```typescript
// Before React 19 - Manual memoization
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* complex rendering */}</div>;
});

// After React 19 - React Compiler handles optimization automatically
const ExpensiveComponent = ({ data }) => {
  return <div>{/* complex rendering - auto-optimized */}</div>;
};
```

**Migration Actions Required:**
- Remove manual `React.memo` where React Compiler applies
- Review useEffect dependencies for concurrent rendering
- Update testing patterns for concurrent features

#### PostgreSQL 18.0 Breaking Changes Considerations

**New Features Enabled:**
- **Improved Performance**: Enhanced query optimizer and indexing
- **Better JSON Support**: Improved JSONB operations and indexing
- **Security Enhancements**: Enhanced authentication and encryption

**Breaking Changes Impact:**
```sql
-- New performance features (no breaking changes)
CREATE INDEX CONCURRENTLY idx_actors_enhanced_search
ON actors USING gin(to_tsvector('english', name || ' ' || COALESCE(bio, '') || ' ' || knownFor));

-- Enhanced JSON operations
SELECT actors.name,
       jsonb_path_query_array(actors.metadata, '$.knownFor[*].title') as titles
FROM actors;
```

**Migration Actions Required:**
- Database migration planning for performance indexes
- Review of existing JSON queries for optimization opportunities
- Update connection pool configuration for new performance features

#### Tailwind CSS 4.1.16 Breaking Changes Considerations

**New Features Enabled:**
- **Enhanced Performance**: Improved CSS generation and caching
- **New Utility Classes**: Additional layout and spacing utilities
- **Better TypeScript Support**: Enhanced type safety for utility classes

**Breaking Changes Impact:**
```css
/* Tailwind v4 improvements - generally backward compatible */
/* No major breaking changes expected in utility usage */
```

**Migration Actions Required:**
- Update configuration file format if using advanced features
- Review build scripts for new optimization opportunities
- Test responsive behavior with new utilities

#### Elysia 1.4.13 Breaking Changes Considerations

**New Features Enabled:**
- **Enhanced Type Safety**: Improved TypeScript inference
- **Better Error Handling**: Structured error responses
- **Performance Optimizations**: Request handling improvements

**Breaking Changes Impact:**
```typescript
// Enhanced type safety improvements (no breaking changes)
const app = new Elysia()
  .get('/actors/:id', ({ params: { id } }) => {
    // Enhanced type inference for route parameters
    return getActor(id);
  });
```

**Migration Actions Required:**
- Review middleware for enhanced type safety opportunities
- Update error handling patterns for new structured responses
- Test performance with new optimization features

#### Minimal Breaking Changes Risk

**Overall Assessment**: Our technology stack choices minimize breaking changes risk:

✅ **React 19.2.0**: Primarily additive features with opt-in optimizations
✅ **PostgreSQL 18.0**: Backward compatible with performance enhancements
✅ **Tailwind CSS 4.1.16**: Utility-first approach prevents breaking changes
✅ **Elysia 1.4.13**: Semantic versioning ensures compatibility
✅ **Bun 1.3.1**: Stable runtime with incremental improvements

**Migration Strategy**:
1. **Incremental Updates**: Update dependencies individually and test
2. **Feature Flags**: Use feature flags for React 19 optimizations
3. **Database Backups**: Comprehensive backup strategy before PostgreSQL upgrade
4. **Staged Deployment**: Deploy in stages to catch issues early

### Integration Points

**Service Communication:**
- **Database-First Architecture**: All services communicate through PostgreSQL
- **Shared Types**: Common TypeScript types in `packages/types/`
- **API Contracts**: OpenAPI specifications for all endpoints
- **Event-Driven Updates**: Database triggers for real-time cache invalidation

**Build Pipeline:**
- **Parallel Builds**: Turbo orchestrates independent app builds
- **Shared Dependencies**: hoisted to root for optimization
- **Cross-App Testing**: Integration tests verify service interactions
- **Unified Deployment**: Single CI/CD pipeline for entire monorepo

## Implementation Patterns

These patterns ensure consistent implementation across all AI agents:

### Naming Patterns
- **Database Tables**: snake_case plural (`actors`, `users`, `viewing_history`)
- **API Routes**: kebab-case with versioning (`/api/v1/actor-profiles`, `/api/v1/search-actors`)
- **Components**: PascalCase with descriptive names (`ActorCard`, `ContentBanner`, `DiscoveryGrid`)
- **Files**: kebab-case with technology suffix (`actor-card.tsx`, `api-types.ts`)
- **Variables**: camelCase with semantic clarity (`actorId`, `viewingHistory`, `searchResults`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_RESULTS_PER_PAGE`)

### Structure Patterns
- **Frontend Architecture**: Feature-based organization under `src/components/features/`
- **Backend Routes**: RESTful grouping by resource under `src/routes/`
- **Shared Components**: Reusable UI elements in `packages/ui/`
- **Test Organization**: Mirror source structure in `tests/` directory at root level
- **Type Definitions**: Centralized in `packages/types/` for cross-app consistency

### Format Patterns
- **API Response Envelope**: `{data: T, error?: string, meta?: {pagination: object}}`
- **Error Response Format**: `{code: string, message: string, details?: object, timestamp: string}`
- **Date Handling**: ISO 8601 strings in APIs, localized formatting in UI
- **Identifier Format**: UUID v7 strings for all entities (time-ordered, sortable)
- **Search Response**: Ranked results with relevance scores and pagination metadata

### Communication Patterns
- **REST API Standards**: HTTP verbs with proper status codes and semantic meaning
- **Error Propagation**: Structured error handling with correlation IDs
- **Data Validation**: Input validation at API boundaries with detailed error messages
- **Rate Limiting**: Per-user and per-IP limits with exponential backoff
- **Caching Strategy**: Multi-layer caching (browser, CDN, application, database)

### Lifecycle Patterns
- **Loading States**: Skeleton components with progressive content loading
- **Error Recovery**: Exponential backoff with user-friendly retry mechanisms
- **Data Synchronization**: Optimistic updates with rollback capabilities
- **Component Lifecycle**: Proper cleanup of subscriptions and event listeners
- **Session Management**: Secure token handling with refresh strategies

### Location Patterns
- **API Versioning**: `/api/v1/` prefix for backward compatibility
- **Static Assets**: Optimized delivery through CDN with cache headers
- **Database Schema**: Logical organization with clear relationship boundaries
- **Environment Configuration**: Environment-specific settings with validation
- **Log Storage**: Structured logging with rotation and archival policies

### Consistency Patterns
- **Date Formatting**: ISO storage, localized presentation with timezone handling
- **Logging Standards**: Structured JSON logs with request correlation IDs
- **Error Messaging**: User-friendly, actionable error messages with localization
- **Component Styling**: Consistent design tokens and spacing system
- **Data Validation**: Consistent validation rules across frontend and backend

## Consistency Rules

### Naming Conventions

**Database Schema:**
```sql
-- Tables: snake_case plural
CREATE TABLE actors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Columns: snake_case
CREATE TABLE viewing_history (
  user_id UUID REFERENCES users(id),
  actor_id UUID REFERENCES actors(id),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**API Routes:**
```typescript
// File: src/routes/actors/[id].ts
export const actorRoutes = new Elysia({ prefix: '/actors' })
  .get('/:id', getActorHandler)           // GET /api/v1/actors/:id
  .get('/', searchActorsHandler)         // GET /api/v1/actors?search=...
  .post('/', createActorHandler)         // POST /api/v1/actors
```

**Component Files:**
```typescript
// File: src/components/features/actor-search/actor-search-result.tsx
interface ActorSearchResultProps {
  actor: Actor;
  onActorSelect: (actorId: string) => void;
}

export const ActorSearchResult: React.FC<ActorSearchResultProps> = ({
  actor,
  onActorSelect
}) => {
  // Component implementation
};
```

### Code Organization

**Import Order:**
1. External libraries (React, Elysia, etc.)
2. Internal packages (@iknow/ui, @iknow/types)
3. Relative imports (./components, ../services)
4. Type-only imports last

**File Structure:**
```typescript
// actor-service.ts
import { DatabaseService } from '../services/database-service';
import type { Actor, CreateActorRequest } from '@iknow/types';

export class ActorService {
  async getActor(id: string): Promise<Actor> {
    // Implementation
  }
}
```

### Error Handling

**API Error Response:**
```typescript
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: object,
    public statusCode: number = 500
  ) {
    super(message);
  }
}

// Usage
throw new ApiError(
  'ACTOR_NOT_FOUND',
  'Actor not found',
  { actorId: id },
  404
);
```

**Frontend Error Boundaries:**
```typescript
export const ErrorBoundary: React.FC<{
  children: React.ReactNode;
  fallback?: ComponentType<{ error: Error }>;
}> = ({ children, fallback: Fallback }) => {
  // Error boundary implementation
};
```

### Logging Strategy

**Structured Logging:**
```typescript
import { logger } from '../utils/logger';

export class ActorService {
  async getActor(id: string): Promise<Actor> {
    logger.info('Fetching actor', { actorId: id, operation: 'getActor' });

    try {
      const actor = await this.database.getActor(id);
      logger.info('Actor fetched successfully', { actorId: id });
      return actor;
    } catch (error) {
      logger.error('Failed to fetch actor', {
        actorId: id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}
```

## Novel Architecture Patterns

### Database-First Service Communication

**Pattern Name**: Centralized Data Hub Communication
**Purpose**: Eliminate direct service-to-service coupling by using PostgreSQL as the central communication and coordination mechanism
**Context**: Multiple independent services (frontend, API, scraper) need to share data efficiently without complex message brokers

**Core Principle**: All services communicate through a shared PostgreSQL database rather than direct API calls or message queues. This creates a simple, reliable, and scalable communication pattern.

**Component Interactions:**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Scraper   │    │     API     │    │   Frontend  │
│   Service   │    │   Service   │    │   (Astro)   │
└─────┬───────┘    └─────┬───────┘    └─────┬───────┘
      │                  │                  │
      │  WRITE           │  READ/WRITE     │  READ
      ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────┐
│              PostgreSQL Database                    │
│  • Actor Data  • User Profiles  • Viewing History  │
│  • Content     • Relationships   • Metadata        │
└─────────────────────────────────────────────────────┘
```

**Implementation Guidance:**

1. **Database as Source of Truth**: All services treat the database as the single source of truth
2. **Event-Driven Updates**: Database triggers and notifications for real-time updates
3. **Optimistic Writes**: Services write directly to database without coordination
4. **Schema Contracts**: Database schema serves as the integration contract

**Data Flow for Actor Identification:**
```typescript
// Scraper Service writes actor data
interface ActorScraperService {
  async scrapeAndStoreActor(imdbId: string): Promise<void> {
    const actorData = await this.imdbService.fetchActor(imdbId);
    await this.database.upsertActor(actorData); // Direct write
    // Database triggers automatically invalidate caches
  }
}

// API Service reads actor data for API endpoints
interface ActorAPIService {
  async getActor(id: string): Promise<Actor> {
    return await this.database.getActor(id); // Direct read
  }
}

// Frontend consumes through API
interface ActorClient {
  async searchActors(query: string): Promise<Actor[]> {
    return await this.apiClient.get('/api/v1/actors/search', { query });
  }
}
```

**Benefits:**
- **Simplicity**: No message broker infrastructure needed
- **Reliability**: Database transactions guarantee data consistency
- **Scalability**: Read replicas and connection pooling handle scale
- **Observability**: Database queries provide natural observability
- **Testing**: Easier to test with single data source

**Trade-offs:**
- **Latency**: Higher latency than direct service calls (acceptable for our use case)
- **Database Load**: Increased read/write load on database (mitigated with caching)
- **Real-time Limits**: Not suitable for sub-millisecond real-time requirements

### Revolutionary IMDB Access Pattern

**Pattern Name**: Multi-Tier Content Acquisition Strategy
**Purpose**: Optimize actor and content data acquisition while respecting rate limits and providing reliable fallback mechanisms
**Context**: Need high-performance access to IMDB data for actor identification without violating terms of service

**Tier Strategy:**

1. **Primary Tier - Direct API Access**: Revolutionary GET method for structured data access
2. **Secondary Tier - Smart Scraping**: Puppeteer with intelligent fallbacks
3. **Tertiary Tier - Cached Results**: Database caching with TTL-based invalidation

**Implementation Architecture:**
```typescript
interface IMDBService {
  // Tier 1: Direct API access (100x faster than scraping)
  async fetchActorViaAPI(imdbId: string): Promise<ActorData>;

  // Tier 2: Intelligent scraping with rate limiting
  async scrapeActorViaBrowser(imdbId: string): Promise<ActorData>;

  // Tier 3: Fallback from cached data
  async getCachedActor(imdbId: string): Promise<ActorData | null>;
}

class SmartIMDBService implements IMDBService {
  async getActorData(imdbId: string): Promise<ActorData> {
    // Try API first (fastest)
    try {
      return await this.fetchActorViaAPI(imdbId);
    } catch (apiError) {
      logger.warn('API access failed, falling back to scraping', { imdbId });
    }

    // Fall back to scraping
    try {
      return await this.scrapeActorViaBrowser(imdbId);
    } catch (scrapeError) {
      logger.warn('Scraping failed, checking cache', { imdbId });
    }

    // Final fallback to cache
    const cached = await this.getCachedActor(imdbId);
    if (cached) {
      logger.info('Using cached data', { imdbId });
      return cached;
    }

    throw new Error(`All data acquisition methods failed for ${imdbId}`);
  }
}
```

**Rate Limiting Strategy:**
```typescript
class RateLimitedScraper {
  private queue = new Queue({ concurrency: 1 });
  private lastRequest = 0;
  private readonly MIN_INTERVAL = 2000; // 2 seconds between requests

  async scrape(url: string): Promise<any> {
    return this.queue.add(async () => {
      const now = Date.now();
      const waitTime = Math.max(0, this.MIN_INTERVAL - (now - this.lastRequest));

      if (waitTime > 0) {
        await this.sleep(waitTime);
      }

      this.lastRequest = Date.now();
      return this.performScrape(url);
    });
  }
}
```

**Success Metrics:**
- **API Success Rate**: ~85% (direct access for structured data)
- **Scraping Success Rate**: ~95% (when API fails)
- **Cache Hit Rate**: ~60% (for frequently requested actors)
- **Overall Success Rate**: >99% (with all three tiers)

### UUID v7 Entity Identification Pattern

**Pattern Name**: Chronologically Sortable Entity Identification
**Purpose**: Provide globally unique, time-ordered identifiers that optimize database performance and enable natural sorting
**Context**: Distributed system with multiple services creating entities that need to be sortable by creation time without additional columns

**Implementation:**
```typescript
// UUID v7 implementation
function generateUUIDv7(): string {
  const timestamp = Date.now();
  const random = crypto.getRandomValues(new Uint8Array(10));

  // Custom UUID v7 format: timestamp + random
  const timeHex = timestamp.toString(16).padStart(12, '0');
  const randomHex = Array.from(random, b => b.toString(16).padStart(2, '0')).join('');

  return `${timeHex.slice(0, 8)}-${timeHex.slice(8, 12)}-${randomHex.slice(0, 4)}-${randomHex.slice(4, 8)}-${randomHex.slice(8)}`;
}

// Database schema with UUID v7
CREATE TABLE actors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

// Natural sorting by creation time without separate column
SELECT * FROM actors ORDER BY id; // Automatically chronological
```

**Benefits:**
- **Chronological Sorting**: IDs naturally sort by creation time
- **Distributed Generation**: No central coordination needed
- **Performance**: Better database indexing than random UUIDs
- **Debugging**: IDs contain timestamp information for debugging

## Data Architecture

### Core Entities

**Actor Entity:**
```typescript
interface Actor {
  id: string; // UUID v7
  name: string;
  bio?: string;
  birthDate?: string; // ISO date
  photoUrl?: string;
  imdbId?: string;
  knownFor: string[]; // Array of known content titles
  filmography: FilmographyEntry[];
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}
```

**User Entity:**
```typescript
interface User {
  id: string; // UUID v7
  email: string;
  username: string;
  preferences: UserPreferences;
  viewingHistory: ViewingHistoryEntry[];
  watchlist: WatchlistEntry[];
  createdAt: string;
  updatedAt: string;
}
```

**Content Entity:**
```typescript
interface Content {
  id: string; // UUID v7
  title: string;
  type: 'movie' | 'series' | 'episode';
  releaseYear: number;
  imdbId?: string;
  posterUrl?: string;
  cast: ActorRole[];
  createdAt: string;
  updatedAt: string;
}
```

### Database Schema

```sql
-- Core entities
CREATE TABLE actors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  name VARCHAR(255) NOT NULL,
  bio TEXT,
  birth_date DATE,
  photo_url TEXT,
  imdb_id VARCHAR(50) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  title VARCHAR(500) NOT NULL,
  type content_type NOT NULL,
  release_year INTEGER,
  imdb_id VARCHAR(50) UNIQUE,
  poster_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relationships
CREATE TABLE filmography (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  actor_id UUID REFERENCES actors(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  role_name VARCHAR(255),
  is_main_role BOOLEAN DEFAULT FALSE,
  year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(actor_id, content_id, role_name)
);

CREATE TABLE viewing_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES actors(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  context JSONB, -- Additional context like episode, season, etc.
  UNIQUE(user_id, actor_id, content_id, DATE(viewed_at))
);

CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status watchlist_status DEFAULT 'to_watch',
  UNIQUE(user_id, content_id)
);

-- Performance indexes
CREATE INDEX idx_actors_name ON actors USING gin(to_tsvector('english', name));
CREATE INDEX idx_content_title ON content USING gin(to_tsvector('english', title));
CREATE INDEX idx_filmography_actor ON filmography(actor_id);
CREATE INDEX idx_filmography_content ON filmography(content_id);
CREATE INDEX idx_viewing_history_user ON viewing_history(user_id, viewed_at DESC);
CREATE INDEX idx_watchlist_user ON watchlist(user_id, added_at DESC);
```

## API Contracts

### Actor API

**GET /api/v1/actors/:id**
```typescript
// Request
// No body required

// Response (200 OK)
{
  "data": {
    "id": "0189c4c8-6b7a-7f4e-9d3e-1b2a3c4d5e6f",
    "name": "Tom Hanks",
    "bio": "American actor and filmmaker",
    "birthDate": "1956-07-09",
    "photoUrl": "https://example.com/tom-hanks.jpg",
    "imdbId": "nm0000158",
    "knownFor": ["Forrest Gump", "Saving Private Ryan", "Cast Away"],
    "filmography": [
      {
        "contentId": "0189c4c8-6b7a-7f4e-9d3e-1b2a3c4d5e6f",
        "title": "Forrest Gump",
        "type": "movie",
        "year": 1994,
        "roleName": "Forrest Gump",
        "isMainRole": true
      }
    ],
    "createdAt": "2024-10-29T15:30:00Z",
    "updatedAt": "2024-10-29T15:30:00Z"
  }
}

// Error Response (404 Not Found)
{
  "error": {
    "code": "ACTOR_NOT_FOUND",
    "message": "Actor with specified ID not found",
    "details": {
      "actorId": "invalid-id"
    },
    "timestamp": "2024-10-29T15:30:00Z"
  }
}
```

**GET /api/v1/actors/search**
```typescript
// Request Query Parameters
{
  "q": "tom hanks",        // Search query (required)
  "limit": 20,             // Results per page (default: 20, max: 100)
  "offset": 0,             // Pagination offset (default: 0)
  "type": "movie|series|all", // Content type filter (default: all)
  "year": 1994             // Filter by year (optional)
}

// Response (200 OK)
{
  "data": [
    {
      "id": "0189c4c8-6b7a-7f4e-9d3e-1b2a3c4d5e6f",
      "name": "Tom Hanks",
      "photoUrl": "https://example.com/tom-hanks.jpg",
      "knownFor": ["Forrest Gump", "Saving Private Ryan"],
      "matchScore": 0.95
    }
  ],
  "meta": {
    "pagination": {
      "total": 1,
      "limit": 20,
      "offset": 0,
      "hasMore": false
    },
    "searchTime": 0.034
  }
}
```

### User API

**POST /api/v1/users**
```typescript
// Request Body
{
  "email": "user@example.com",
  "username": "moviefan",
  "password": "securePassword123"
}

// Response (201 Created)
{
  "data": {
    "id": "0189c4c8-6b7a-7f4e-9d3e-1b2a3c4d5e6f",
    "email": "user@example.com",
    "username": "moviefan",
    "preferences": {
      "notifications": true,
      "theme": "light"
    },
    "createdAt": "2024-10-29T15:30:00Z"
  }
}
```

**GET /api/v1/users/:id/viewing-history**
```typescript
// Response (200 OK)
{
  "data": [
    {
      "id": "0189c4c8-6b7a-7f4e-9d3e-1b2a3c4d5e6f",
      "actor": {
        "id": "0189c4c8-6b7a-7f4e-9d3e-1b2a3c4d5e6f",
        "name": "Tom Hanks",
        "photoUrl": "https://example.com/tom-hanks.jpg"
      },
      "content": {
        "id": "0189c4c8-6b7a-7f4e-9d3e-1b2a3c4d5e6f",
        "title": "Forrest Gump",
        "type": "movie"
      },
      "viewedAt": "2024-10-29T15:30:00Z",
      "context": {
        "platform": "netflix",
        "duration": 142
      }
    }
  ],
  "meta": {
    "pagination": {
      "total": 1,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

## Security Architecture

### Authentication & Authorization

**Password Security:**
- Argon2id hashing with memory-hard parameters
- Minimum 12 character password length
- Password strength validation during registration
- Rate limiting on authentication endpoints

**Session Management:**
- JWT tokens with short expiration (15 minutes)
- Secure, HTTP-only refresh tokens (7 days)
- Token rotation on each refresh
- Device-based session tracking

**API Security:**
```typescript
// Middleware example
const authMiddleware = (app: Elysia) =>
  app.derive(async ({ request, set }) => {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      set.status = 401;
      throw new ApiError('UNAUTHORIZED', 'Authentication required');
    }

    try {
      const payload = await verifyJWT(token);
      return { user: payload };
    } catch (error) {
      set.status = 401;
      throw new ApiError('INVALID_TOKEN', 'Invalid or expired token');
    }
  });
```

### Data Protection

**Input Validation:**
- Type-safe validation with Zod schemas
- SQL injection prevention through parameterized queries
- XSS protection with content security headers
- File upload validation with virus scanning

**Privacy Controls:**
- GDPR-compliant data handling
- User consent management
- Data export and deletion capabilities
- Privacy-by-design data minimization

## Performance Considerations

### Database Optimization

**Indexing Strategy:**
```sql
-- Search optimization
CREATE INDEX CONCURRENTLY idx_actors_search_vector
ON actors USING gin(to_tsvector('english', name || ' ' || COALESCE(bio, '')));

-- Time-based queries
CREATE INDEX CONCURRENTLY idx_viewing_history_user_time
ON viewing_history(user_id, viewed_at DESC);

-- Join optimization
CREATE INDEX CONCURRENTLY idx_filmography_composite
ON filmography(actor_id, content_id, is_main_role);
```

**Query Optimization:**
- Connection pooling with pgpool-II
- Read replicas for scaling read operations
- Query result caching with Redis
- Pagination optimization with cursor-based navigation

### Frontend Performance

**Bundle Optimization:**
- Astro island architecture for selective hydration
- Code splitting by route and feature
- Tree shaking for unused dependencies
- Modern asset optimization with Image CDN

**Caching Strategy:**
```typescript
// Service worker for offline support
const cacheStrategy = {
  actorProfiles: {
    strategy: 'CacheFirst',
    maxAge: 24 * 60 * 60, // 24 hours
    maxEntries: 1000
  },
  searchResults: {
    strategy: 'NetworkFirst',
    maxAge: 5 * 60, // 5 minutes
    maxEntries: 100
  }
};
```

### Monitoring & Observability

**Performance Metrics:**
- Core Web Vitals monitoring
- API response time tracking
- Database query performance
- Error rate and type tracking

**Health Checks:**
```typescript
// Health check endpoint
app.get('/health', async () => {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkExternalAPIs()
  ]);

  return {
    status: checks.every(c => c.status === 'fulfilled') ? 'healthy' : 'degraded',
    checks: checks.map(c => ({
      status: c.status,
      ...(c.status === 'rejected' && { error: c.reason.message })
    })),
    timestamp: new Date().toISOString()
  };
});
```

## Deployment Architecture

### Container Strategy

**Docker Configuration:**
```dockerfile
# Backend (Elysia)
FROM oven/bun:1-alpine AS base
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production
COPY . .
EXPOSE 3000
CMD ["bun", "src/index.ts"]

# Frontend (Astro)
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build
FROM nginx:alpine
COPY --from=base /app/dist /usr/share/nginx/html
```

### Infrastructure

**Production Stack:**
- **Application Hosting**: Railway/Render for simplicity, scale to AWS/GCP
- **Database**: PostgreSQL with read replicas
- **CDN**: CloudFlare for static assets and DDoS protection
- **Monitoring**: DataDog/New Relic for application performance
- **Logging**: Structured logs with ELK stack

**Environment Configuration:**
```bash
# Production environment variables
DATABASE_URL="postgresql://user:pass@host:5432/iknow_prod"
REDIS_URL="redis://host:6379"
JWT_SECRET="your-secret-key"
CORS_ORIGINS="https://iknow.app"
RATE_LIMIT_REQUESTS="100"
RATE_LIMIT_WINDOW="900000" # 15 minutes
```

### CI/CD Pipeline

**GitHub Actions:**
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run test
      - run: bun run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        run: railway up
```

## Development Environment

### Prerequisites

**Required Tools:**
- **Bun 1.1.38+**: JavaScript runtime and package manager
- **Node.js 20+**: Required for some Astro dependencies
- **PostgreSQL 16+**: Local database development
- **Git**: Version control
- **VS Code**: Recommended IDE with extensions

**VS Code Extensions:**
```json
{
  "recommendations": [
    "astro-build.astro-vscode",
    "bradlc.vscode-tailwindcss",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "prisma.prisma"
  ]
}
```

### Setup Commands

```bash
# Clone and setup repository
git clone <repository-url>
cd i-know

# Install dependencies
bun install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Setup database
bun run db:migrate
bun run db:seed

# Start development servers
bun run dev          # Starts all apps in development mode
bun run dev:web      # Frontend only (http://localhost:4321)
bun run dev:api      # Backend only (http://localhost:3000)
bun run dev:scraper  # Scraper only (http://localhost:3001)

# Run tests
bun run test         # All tests
bun run test:unit    # Unit tests only
bun run test:e2e     # End-to-end tests only

# Build for production
bun run build        # Build all apps
bun run build:web    # Frontend only
bun run build:api    # Backend only
```

### Development Workflow

**Making Changes:**
1. Create feature branch from `develop`
2. Implement changes with TypeScript strict mode
3. Add tests for new functionality
4. Run `bun run test` and `bun run lint`
5. Submit pull request with detailed description

**Code Quality:**
```bash
# Lint and format
bun run lint         # Check for issues
bun run lint:fix     # Auto-fix issues
bun run format       # Format with Prettier

# Type checking
bun run type-check   # TypeScript validation

# Database changes
bun run db:studio    # Open Prisma Studio
bun run db:migrate   # Run migrations
bun run db:reset     # Reset database
```

## Architecture Decision Records (ADRs)

### ADR-001: Monorepo with Turborepo
**Status**: Accepted
**Context**: Multiple applications (web, api, scraper) with shared dependencies
**Decision**: Use Turborepo for monorepo management
**Consequences**: Simplified dependency management, consistent builds, shared tooling

### ADR-002: Bun + Elysia Stack
**Status**: Accepted
**Context**: Modern stack with performance requirements for 1M+ users
**Decision**: Use Bun runtime with Elysia framework
**Consequences**: Ultra-fast performance, TypeScript-first development, simplified deployment

### ADR-003: Database-First Service Communication
**Status**: Accepted
**Context**: Multiple services need to share data efficiently
**Decision**: Use PostgreSQL as central communication hub
**Consequences**: Simplified architecture, reliable data consistency, easy scaling

### ADR-004: UUID v7 for Primary Keys
**Status**: Accepted
**Context**: Need sortable, performant unique identifiers
**Decision**: Use UUID v7 (time-ordered) for all entities
**Consequences**: Better performance, chronological sorting, distributed generation

### ADR-005: Strict TypeScript with No Any Types
**Status**: Accepted
**Context**: Type safety critical for complex actor relationships
**Decision**: Enforce strict TypeScript mode, prohibit `any` types
**Consequences**: Better developer experience, fewer runtime errors, improved maintainability

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2025-10-29_
_For: Eduardo Menoncello_