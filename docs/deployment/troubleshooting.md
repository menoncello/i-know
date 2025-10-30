# Troubleshooting Guide

This guide covers common issues and solutions for the I Know platform.

## 🚨 Quick Diagnostics

### Health Checks

```bash
# Check API health
curl http://localhost:3001/health

# Check web app
curl http://localhost:3000

# Check database connection
bun run db:migrate
```

### Service Status

```bash
# Check running processes
ps aux | grep -E "(bun|node|postgres)"

# Check ports
lsof -i :3000  # Web app
lsof -i :3001  # API
lsof -i :5432  # PostgreSQL
```

## 🔧 Development Issues

### Installation Problems

#### Bun Install Fails

**Problem**: `bun install` fails with dependency errors.

**Solutions**:

```bash
# Clear cache
bun rm -rf node_modules .bun
bun install

# Update Bun
bun upgrade

# Check package.json syntax
bun run type-check
```

#### TypeScript Errors

**Problem**: TypeScript compilation fails.

**Solutions**:

```bash
# Check TypeScript version
bun --version

# Reinstall types
rm -rf node_modules
bun install

# Check tsconfig.json
bun run type-check
```

#### Database Connection Issues

**Problem**: Cannot connect to PostgreSQL.

**Solutions**:

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Start PostgreSQL
docker run --name postgres-dev \
  -e POSTGRES_DB=i_know_development \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:18-alpine

# Test connection
psql postgresql://postgres:password@localhost:5432/i_know_development

# Check environment variables
cat .env | grep DATABASE_URL
```

### Build Issues

#### Build Fails

**Problem**: `bun run build` fails.

**Solutions**:

```bash
# Clean build artifacts
bun run clean

# Fresh install
bun run clean:all

# Check TypeScript errors
bun run type-check

# Check ESLint errors
bun run lint

# Build verbose mode
bun run build --verbose
```

#### Turbo Build Issues

**Problem**: Turborepo build fails with caching issues.

**Solutions**:

```bash
# Clear Turbo cache
rm -rf .turbo

# Force rebuild
bun run build --force

# Check turbo.json syntax
cat turbo.json | jq .
```

## 🌐 Runtime Issues

### API Server Problems

#### Server Won't Start

**Problem**: API server fails to start.

**Solutions**:

```bash
# Check logs
bun run dev:api

# Check port availability
lsof -i :3001

# Kill existing process
pkill -f "apps/api/src/index.ts"

# Start in debug mode
NODE_ENV=debug bun run dev:api
```

#### API Requests Fail

**Problem**: API endpoints return errors.

**Solutions**:

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test with verbose output
curl -v http://localhost:3001/api/v1/actors

# Check database connection
bun run db:migrate

# Review error logs
tail -f logs/api.log
```

#### CORS Issues

**Problem**: Frontend cannot connect to API.

**Solutions**:

```bash
# Check CORS configuration
grep -r "cors" apps/api/src/

# Test API directly
curl -H "Origin: http://localhost:3000" \
     http://localhost:3001/api/v1/actors
```

### Web App Problems

#### Frontend Won't Load

**Problem**: Web app fails to load or shows blank page.

**Solutions**:

```bash
# Check web app logs
bun run dev:web

# Check build output
ls -la apps/web/dist/

# Test Astro config
bun run dev:web --verbose

# Clear Astro cache
rm -rf apps/web/.astro
```

#### API Calls Fail

**Problem**: Frontend cannot reach backend API.

**Solutions**:

```bash
# Check API URL
grep -r "localhost" apps/web/src/

# Test API manually
curl http://localhost:3001/health

# Check environment variables
cat apps/web/.env
```

### Database Issues

#### Migration Failures

**Problem**: Database migrations fail.

**Solutions**:

```bash
# Check migration script
cat packages/database/scripts/migrate.ts

# Test database connection
bun run db:migrate

# Check database exists
psql -l | grep i_know

# Manual migration
psql $DATABASE_URL -c "CREATE TABLE IF NOT EXISTS actors (...)"
```

#### Performance Issues

**Problem**: Database queries are slow.

**Solutions**:

```bash
# Check slow queries
psql $DATABASE_URL -c "
  SELECT query, mean_time, calls
  FROM pg_stat_statements
  ORDER BY mean_time DESC
  LIMIT 10;
"

# Check indexes
psql $DATABASE_URL -c "\d actors"

# Analyze tables
psql $DATABASE_URL -c "ANALYZE actors;"
```

#### Connection Pool Exhaustion

**Problem**: Too many database connections.

**Solutions**:

```bash
# Check active connections
psql $DATABASE_URL -c "
  SELECT count(*), state
  FROM pg_stat_activity
  GROUP BY state;
"

# Reduce connection pool size
# In database connection config:
max: 10  // Reduce from default
```

## 🚢 Deployment Issues

### Railway Deployment

#### Build Failures on Railway

**Problem**: Deployment fails during build phase.

**Solutions**:

```bash
# Check build logs
railway logs

# Test locally
docker build -t test apps/api/

# Check Railway configuration
cat railway.toml

# Verify environment variables
railway variables
```

#### Application Won't Start

**Problem**: Application builds but won't start.

**Solutions**:

```bash
# Check start command
grep -A 5 "scripts" package.json

# Test start command locally
bun run start

# Check Railway logs
railway logs

# Add debug logging
console.log('Starting application...');
```

#### Database Connection Issues

**Problem**: Cannot connect to Railway PostgreSQL.

**Solutions**:

```bash
# Check database URL
railway variables | grep DATABASE_URL

# Test connection locally
DATABASE_URL=$(railway variables get DATABASE_URL) bun run db:migrate

# Check database logs
railway logs postgresql
```

### Docker Deployment

#### Container Won't Start

**Problem**: Docker container fails to start.

**Solutions**:

```bash
# Check container logs
docker-compose logs api

# Inspect container
docker-compose ps

# Rebuild containers
docker-compose build --no-cache

# Check Dockerfile
cat apps/api/Dockerfile
```

#### Port Conflicts

**Problem**: Services can't bind to ports.

**Solutions**:

```bash
# Check port usage
lsof -i :3001

# Kill conflicting processes
pkill -f "node.*3001"

# Change ports in docker-compose.yml
ports:
  - "3002:3001"  # Use different host port
```

#### Volume Issues

**Problem**: Database data persists incorrectly.

**Solutions**:

```bash
# Check volumes
docker volume ls

# Remove corrupted volumes
docker volume rm i-know_postgres_data

# Recreate with proper permissions
docker-compose down -v
docker-compose up -d
```

## 🔒 Security Issues

### SSL/TLS Problems

#### HTTPS Redirect Issues

**Problem**: HTTPS redirects don't work.

**Solutions**:

```bash
# Check SSL certificates
openssl s_client -connect iknow.com:443

# Test HTTP to HTTPS redirect
curl -v http://iknow.com

# Check Nginx/Apache config
grep -r "ssl" /etc/nginx/
```

#### Certificate Issues

**Problem**: SSL certificate expired or invalid.

**Solutions**:

```bash
# Check certificate expiry
openssl x509 -in /path/to/cert.pem -noout -dates

# Renew certificate (Let's Encrypt)
certbot renew

# Test certificate chain
curl -v https://iknow.com
```

### Environment Variable Exposure

#### Sensitive Data in Logs

**Problem**: Passwords or API keys appear in logs.

**Solutions**:

```bash
# Check environment variables
env | grep -i "password\|key\|secret"

# Mask sensitive data in logs
# Use environment-specific configurations
export NODE_ENV=production
export LOG_LEVEL=info
```

## 📊 Performance Issues

### Slow API Responses

**Problem**: API endpoints are slow.

**Solutions**:

```bash
# Profile API endpoints
curl -w "@curl-format.txt" http://localhost:3001/api/v1/actors

# Check database query performance
psql $DATABASE_URL -c "
  EXPLAIN ANALYZE SELECT * FROM actors LIMIT 10;
"

# Enable query logging
# In postgresql.conf:
log_statement = 'all'
log_duration = on
```

### Memory Leaks

**Problem**: Application memory usage increases over time.

**Solutions**:

```bash
# Monitor memory usage
node --inspect apps/api/src/index.ts

# Check for memory leaks
node --trace-gc apps/api/src/index.ts

# Profile with clinic.js
clinic doctor -- node apps/api/src/index.ts
```

### High CPU Usage

**Problem**: High CPU consumption.

**Solutions**:

```bash
# Check CPU usage
top -p $(pgrep -f "apps/api/src/index.ts")

# Profile CPU usage
node --prof apps/api/src/index.ts

# Analyze profile
node --prof-process isolate-*.log > processed.txt
```

## 🧪 Testing Issues

### Test Failures

#### Tests Time Out

**Problem**: Tests fail due to timeouts.

**Solutions**:

```bash
# Increase test timeout
bun test --timeout 10000

# Run tests sequentially
bun test --run-in-band

# Check for infinite loops
grep -r "while.*true" tests/
```

#### Database Test Issues

**Problem**: Tests fail with database errors.

**Solutions**:

```bash
# Use test database
export DATABASE_URL="postgresql://user:pass@localhost:5432/test_db"

# Reset test database
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Run migrations for test DB
DATABASE_URL="postgresql://user:pass@localhost:5432/test_db" bun run db:migrate
```

### Integration Test Issues

#### API Tests Fail

**Problem**: Integration tests can't connect to API.

**Solutions**:

```bash
# Start test server
bun run dev:api &
API_PID=$!

# Run tests
bun test tests/integration/

# Cleanup
kill $API_PID
```

## 📚 Getting Help

### Debug Commands

```bash
# Comprehensive health check
bun run check-all

# Generate diagnostics report
bun run diagnostics

# Export logs for support
bun run export-logs
```

### Support Information

When requesting support, include:

1. **Environment**: OS, Node/Bun version
2. **Error Messages**: Full error stack traces
3. **Logs**: Application and system logs
4. **Configuration**: Environment variables (masked)
5. **Steps to Reproduce**: Detailed reproduction steps

### Log Locations

```
# Development
logs/
  api.log
  web.log
  scraper.log

# Production
/var/log/iknow/
  app.log
  error.log
  access.log

# Docker
docker-compose logs api > api.log
docker-compose logs web > web.log
```

### Useful Commands

```bash
# System information
uname -a
bun --version
psql --version

# Network diagnostics
ping google.com
nslookup api.iknow.com
telnet localhost 3001

# Resource monitoring
htop
iotop
nethogs

# Application diagnostics
ps aux | grep bun
netstat -tulpn | grep :3001
```

## 📖 Prevention

### Regular Maintenance

```bash
# Weekly tasks
bun run clean           # Clean build artifacts
bun run db:backup       # Backup database
bun run security:audit  # Check for vulnerabilities

# Monthly tasks
bun run update:deps     # Update dependencies
bun run performance:test # Run performance tests
bun run logs:rotate    # Rotate log files
```

### Monitoring Setup

Set up alerts for:

- CPU usage > 80%
- Memory usage > 85%
- Disk space < 10%
- Database connections > 15
- API response time > 2s
- Error rate > 5%

### Backup Strategy

```bash
# Database backups
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Code backups
git push origin main --tags

# Configuration backups
cp .env.example .env.backup.$(date +%Y%m%d)
```
