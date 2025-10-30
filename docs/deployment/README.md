# Deployment Guide

This guide covers deploying the I Know platform to different environments.

## 🏗️ Architecture Overview

The I Know platform consists of:

- **Web App**: Static files (Astro + React)
- **API Server**: Node.js application (Elysia + Bun)
- **Scraper Service**: Background service (Bun)
- **Database**: PostgreSQL 18.0+
- **File Storage**: Static assets and images

## 🌍 Environments

### Development

- **Purpose**: Local development and testing
- **Database**: Local PostgreSQL or Docker
- **URL**: `http://localhost:3000` (web), `http://localhost:3001` (API)
- **Auto-deploy**: No

### Staging

- **Purpose**: Pre-production testing
- **Database**: Staging PostgreSQL instance
- **URL**: `https://staging.iknow.com`
- **Auto-deploy**: On `develop` branch push

### Production

- **Purpose**: Live production environment
- **Database**: Production PostgreSQL instance
- **URL**: `https://iknow.com`
- **Auto-deploy**: On `main` branch push

## 🚀 Deployment Options

### Option 1: Railway (Recommended)

Railway provides a simple deployment platform with PostgreSQL.

#### Prerequisites

- Railway account
- Railway CLI (`npm install -g @railway/cli`)
- Domain (optional, for custom domains)

#### Setup

1. **Login to Railway**:

   ```bash
   railway login
   ```

2. **Create Project**:

   ```bash
   railway init
   ```

3. **Configure Services**:

   Create `railway.toml`:

   ```toml
   [build]
   builder = "nixpacks"

   [deploy]
   startCommand = "bun run build && bun run start"

   [[services]]
   name = "api"

   [[services]]
   name = "web"

   [services.variables]
   NODE_ENV = "production"
   DATABASE_URL = "${{postgres.DATABASE_URL}}"
   ```

4. **Add PostgreSQL**:

   ```bash
   railway add postgresql
   ```

5. **Deploy**:
   ```bash
   railway up
   ```

#### Environment Variables

Set these in Railway dashboard:

```env
DATABASE_URL=${{postgres.DATABASE_URL}}
NODE_ENV=production
API_PORT=3001
WEB_PORT=3000
```

### Option 2: Docker Deployment

Deploy using Docker containers.

#### Dockerfile (API)

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

EXPOSE 3001
CMD ["bun", "run", "start"]
```

#### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    ports:
      - '3000:80'
    environment:
      - NODE_ENV=production
    depends_on:
      - api

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    ports:
      - '3001:3001'
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/iknow
    depends_on:
      - db

  scraper:
    build:
      context: ./apps/scraper
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/iknow
    depends_on:
      - db

  db:
    image: postgres:18-alpine
    environment:
      - POSTGRES_DB=iknow
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'

volumes:
  postgres_data:
```

#### Deployment Commands

```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale api=3
```

### Option 3: Vercel + Railway

Use Vercel for frontend and Railway for backend.

#### Frontend (Vercel)

1. **Install Vercel CLI**:

   ```bash
   npm install -g vercel
   ```

2. **Configure vercel.json**:

   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "apps/web/package.json",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "dist"
         }
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/apps/web/$1"
       }
     ]
   }
   ```

3. **Deploy**:
   ```bash
   cd apps/web
   vercel --prod
   ```

#### Backend (Railway)

Follow Railway setup instructions above.

#### Environment Configuration

```env
# Vercel (Frontend)
NEXT_PUBLIC_API_URL=https://api.iknow.com

# Railway (Backend)
DATABASE_URL=${{postgres.DATABASE_URL}}
NODE_ENV=production
```

## 🗄️ Database Setup

### PostgreSQL Configuration

#### Production Settings

```sql
-- postgresql.conf optimizations
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

#### Connection Pooling

```typescript
// Database connection configuration
const sql = postgres({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  ssl: process.env.NODE_ENV === 'production',
  max: 20, // Maximum connections
  idle_timeout: 30,
  connect_timeout: 10,
});
```

#### Database Migration

```bash
# Run migrations on deploy
bun run db:migrate

# Seed data (if needed)
bun run db:seed
```

## 🔒 Security Configuration

### Environment Variables

Never commit sensitive data:

```bash
# Required variables
DATABASE_URL=postgresql://user:pass@host:5432/db
NODE_ENV=production
API_PORT=3001

# Optional variables
IMDB_API_KEY=your_api_key_here
TMDB_API_KEY=your_api_key_here
JWT_SECRET=your_jwt_secret_here
```

### SSL/TLS

Enable HTTPS in production:

```typescript
// API server with SSL
const app = new Elysia().listen({
  port: 3001,
  hostname: '0.0.0.0',
  websocket: false,
  fetch: request => {
    // Handle HTTPS
  },
});
```

### Security Headers

```typescript
// Add security headers
app.add(({ set }) => {
  set.headers['X-Content-Type-Options'] = 'nosniff';
  set.headers['X-Frame-Options'] = 'DENY';
  set.headers['X-XSS-Protection'] = '1; mode=block';
  set.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
});
```

## 📊 Monitoring and Logging

### Application Monitoring

#### Health Checks

```typescript
// Health check endpoint
app.get('/health', async () => {
  const dbStatus = await db`SELECT 1`.then(() => 'ok').catch(() => 'error');

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'i-know-api',
    database: dbStatus,
    memory: process.memoryUsage(),
    uptime: process.uptime(),
  };
});
```

#### Logging

```typescript
// Structured logging
const logger = {
  info: (message: string, meta?: object) => {
    console.log(
      JSON.stringify({
        level: 'info',
        message,
        ...meta,
        timestamp: new Date().toISOString(),
      }),
    );
  },
  error: (message: string, error?: Error) => {
    console.error(
      JSON.stringify({
        level: 'error',
        message,
        error: error?.stack,
        timestamp: new Date().toISOString(),
      }),
    );
  },
};
```

### Database Monitoring

```sql
-- Monitor slow queries
SELECT
  query,
  mean_time,
  calls,
  total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Monitor table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 🔄 CI/CD Pipeline

### GitHub Actions

The CI/CD pipeline is defined in `.github/workflows/ci.yml`:

1. **Test**: Run all tests and checks
2. **Security**: Audit dependencies
3. **Build**: Build all applications
4. **Deploy**: Deploy to appropriate environment

### Deployment Triggers

- **Staging**: Push to `develop` branch
- **Production**: Push to `main` branch
- **Manual**: GitHub Actions UI

### Rollback Strategy

```bash
# Railway rollback
railway rollback

# Git rollback
git revert <commit-hash>
git push origin main

# Database rollback
pg_dump --clean --if-exists -f backup.sql
```

## 🔧 Performance Optimization

### Web App

- Enable CDN for static assets
- Implement proper caching headers
- Optimize images (WebP, lazy loading)
- Minimize JavaScript bundles

### API Server

- Implement response caching
- Use connection pooling
- Optimize database queries
- Enable compression

### Database

- Add appropriate indexes
- Optimize slow queries
- Implement read replicas
- Monitor connection usage

## 🚦 Scaling

### Horizontal Scaling

```bash
# Scale API instances
docker-compose up -d --scale api=3

# Railway scaling (automatic)
# Configure in railway.toml
```

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database performance
- Enable query caching

## 🧪 Pre-deployment Checklist

### Before Deploying

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Backup strategy in place
- [ ] Monitoring setup
- [ ] SSL certificates configured
- [ ] Performance tests run

### Post-deployment

- [ ] Verify API health
- [ ] Test critical user flows
- [ ] Check error logs
- [ ] Monitor performance metrics
- [ ] Validate database connections

## 🆘 Troubleshooting

### Common Issues

#### Database Connection Errors

```bash
# Check connection
psql $DATABASE_URL

# Test migrations
bun run db:migrate

# Check logs
docker-compose logs db
```

#### Build Failures

```bash
# Clear cache
bun run clean:all

# Fresh install
rm -rf node_modules .turbo
bun install

# Check TypeScript
bun run type-check
```

#### Runtime Errors

```bash
# Check logs
docker-compose logs -f api

# Debug mode
NODE_ENV=debug bun run dev:api
```

### Getting Help

- Check [troubleshooting guide](troubleshooting.md)
- Review GitHub Actions logs
- Check application logs
- Monitor database performance
- Contact support team

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Docker Deployment Guide](https://docs.docker.com/get-started/)
- [Vercel Deployment](https://vercel.com/docs)
- [PostgreSQL Performance](https://wiki.postgresql.org/wiki/Tuning_Your_PostgreSQL_Server)
- [Bun Deployment](https://bun.sh/docs/bundler/executables)
