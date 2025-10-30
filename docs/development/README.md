# Development Guide

This guide covers the development workflow, coding standards, and best practices for the I Know platform.

## 🔄 Development Workflow

### 1. Setup Development Environment

1. **Clone and Install**:

   ```bash
   git clone <repository-url>
   cd i-know
   bun install
   ```

2. **Configure Environment**:

   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Setup Database**:

   ```bash
   bun run db:migrate
   bun run db:seed
   ```

4. **Start Development**:
   ```bash
   bun run dev
   ```

### 2. Branching Strategy

Follow Git Flow conventions:

- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature development
- `hotfix/*` - Emergency fixes

### 3. Making Changes

1. **Create Feature Branch**:

   ```bash
   git checkout -b feature/actor-search-improvements
   ```

2. **Make Changes**:
   - Write code following our coding standards
   - Add tests for new functionality
   - Update documentation as needed

3. **Quality Checks**:

   ```bash
   bun run lint:fix
   bun run format
   bun run type-check
   bun run test
   bun run build
   ```

4. **Commit Changes**:
   ```bash
   git add .
   git commit -m "feat: improve actor search performance"
   ```

### 4. Pull Request Process

1. **Push Branch**:

   ```bash
   git push origin feature/actor-search-improvements
   ```

2. **Create Pull Request**:
   - Target `develop` branch
   - Provide clear description
   - Link related issues
   - Request review

3. **Code Review**:
   - Address feedback
   - Update tests
   - Ensure CI passes

4. **Merge**:
   - Squash and merge
   - Delete feature branch

## 📝 Coding Standards

### TypeScript

- Use strict mode enabled
- Prefer explicit types over `any`
- Use interfaces for object shapes
- Export types that are used across packages

```ts
// Good
interface Actor {
  id: string;
  name: string;
  createdAt: Date;
}

// Bad
const actor: any = {
  id: 123,
  name: 'Tom Hanks',
};
```

### Naming Conventions

- **Files**: kebab-case with technology suffix
  - `actor-service.ts`
  - `actor-card.tsx`
- **Components**: PascalCase
  - `ActorCard`
  - `SearchForm`
- **Variables/Functions**: camelCase
  - `const actorName = 'Tom Hanks'`
  - `function searchActors() {}`
- **Constants**: UPPER_SNAKE_CASE
  - `const API_BASE_URL = 'https://api.example.com'`
- **Database Tables**: snake_case plural
  - `actors`, `actor_content`, `user_preferences`

### Code Organization

```ts
// File: packages/types/src/index.ts
// 1. Imports
import type { User } from './user';

// 2. Type definitions
export interface Actor {
  id: string;
  name: string;
  // ...
}

// 3. Type guards
export function isActor(obj: unknown): obj is Actor {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string'
  );
}

// 4. Utility functions
export function createActor(data: CreateActorData): Actor {
  return {
    id: generateId(),
    name: data.name,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
```

## 🧪 Testing Guidelines

### Test Structure

```ts
// packages/utils/src/slugify.test.ts
import { test, expect } from 'bun:test';
import { slugify } from './slugify';

test('slugify basic text', () => {
  expect(slugify('Hello World')).toBe('hello-world');
});

test('slugify removes special characters', () => {
  expect(slugify('Hello World!')).toBe('hello-world');
});

test('slugify handles multiple spaces', () => {
  expect(slugify('Hello   World')).toBe('hello-world');
});
```

### Test Categories

1. **Unit Tests**: Test individual functions/classes
   - Co-located with source files
   - Fast and isolated
   - Mock external dependencies

2. **Integration Tests**: Test component interactions
   - Test API endpoints
   - Test database operations
   - Use test database

3. **E2E Tests**: Test user workflows
   - Test complete user journeys
   - Use browser automation
   - Test real user scenarios

### Testing Best Practices

- **Arrange, Act, Assert** pattern
- **Descriptive test names**
- **Test edge cases and error conditions**
- **Mock external dependencies**
- **Keep tests simple and focused**

```ts
test('searchActors returns paginated results', async () => {
  // Arrange
  const mockActors = [
    { id: '1', name: 'Tom Hanks' },
    { id: '2', name: 'Tom Cruise' },
  ];
  mockDatabase.query.mockResolvedValue(mockActors);

  // Act
  const result = await searchActors({ query: 'Tom', page: 1, limit: 10 });

  // Assert
  expect(result.actors).toHaveLength(2);
  expect(result.total).toBe(2);
  expect(result.page).toBe(1);
});
```

## 🏗️ Architecture Patterns

### Monorepo Structure

Follow the established monorepo structure:

```
apps/
├── web/           # Frontend application
├── api/           # Backend API
└── scraper/       # Data scraping service

packages/
├── ui/            # Shared UI components
├── types/         # Shared type definitions
├── database/      # Database utilities
└── utils/         # Shared utilities
```

### Package Dependencies

- **Apps** can depend on **packages**
- **Packages** can depend on other **packages**
- **Apps** should not depend on other **apps**
- **Shared logic** goes in **packages**

### API Design

RESTful API design with clear patterns:

```ts
// GET /api/v1/actors
// GET /api/v1/actors/:id
// POST /api/v1/actors
// PUT /api/v1/actors/:id
// DELETE /api/v1/actors/:id

// Response format
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### Database Patterns

- Use **UUID v7** for primary keys
- Include **created_at** and **updated_at** timestamps
- Use **snake_case** for table/column names
- Add **indexes** for frequently queried columns
- Use **foreign key constraints** for relationships

```sql
CREATE TABLE actors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  imdb_id VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_actors_name ON actors(name);
CREATE INDEX idx_actors_imdb_id ON actors(imdb_id);
```

## 🔧 Development Tools

### VS Code Extensions

Recommended extensions for development:

- **TypeScript Importer** - Auto import types
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Auto Rename Tag** - JSX tag renaming
- **GitLens** - Git history and blame
- **Thunder Client** - API testing

### Debugging

#### Backend Debugging

```ts
// apps/api/src/index.ts
import { Elysia } from 'elysia';

const app = new Elysia().get('/debug', ({ request }) => {
  console.log('Request headers:', request.headers);
  return { debug: 'enabled' };
});
```

#### Frontend Debugging

```tsx
// apps/web/src/components/ActorCard.tsx
export function ActorCard({ actor }: { actor: Actor }) {
  console.log('ActorCard render:', actor);

  return (
    <div className='actor-card'>
      <h3>{actor.name}</h3>
    </div>
  );
}
```

### Performance Monitoring

Use built-in Bun profiling:

```bash
# Profile API performance
bun --profile apps/api/src/index.ts

# Profile build performance
bun run build --profile
```

## 🚀 Performance Optimization

### Frontend

- Use **React.memo** for expensive components
- Implement **code splitting** with dynamic imports
- Optimize images with WebP format
- Use **intersection observer** for lazy loading

### Backend

- Implement **caching** with Redis
- Use **database connection pooling**
- Optimize database queries with proper indexes
- Use **Bun's built-in optimizations**

### Database

- Add **appropriate indexes**
- Use **query optimization**
- Implement **connection pooling**
- Monitor **query performance**

## 📚 Additional Resources

- [Bun Documentation](https://bun.sh/docs)
- [Turborepo Guide](https://turbo.build/repo/docs)
- [Astro Documentation](https://docs.astro.build/)
- [Elysia Framework](https://elysiajs.com/)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Main)
