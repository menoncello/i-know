# I Know

An actor identification and discovery platform that helps users identify actors in movies, TV shows, and other content using advanced detection algorithms.

## 🏗️ Architecture

This is a monorepo built with:

- **Runtime**: Bun 1.3.1 for ultra-fast performance
- **Monorepo**: Turborepo for optimized builds and caching
- **Frontend**: Astro + React + TypeScript
- **Backend**: Elysia + TypeScript
- **Scraper**: Bun + Puppeteer
- **Database**: PostgreSQL 18.0
- **Testing**: Bun Test framework
- **Code Quality**: ESLint + Prettier + Husky

## 📁 Project Structure

```
i-know/
├── apps/
│   ├── web/           # Astro + React frontend
│   ├── api/           # Elysia backend API
│   └── scraper/       # Bun scraping service
├── packages/
│   ├── ui/            # Shared React components
│   ├── types/         # Shared TypeScript types
│   ├── database/      # Database utilities and migrations
│   └── utils/         # Shared utilities
├── tests/
│   ├── e2e/           # End-to-end tests
│   ├── integration/   # Integration tests
│   └── performance/   # Performance tests
├── docs/
│   ├── development/   # Development documentation
│   └── deployment/    # Deployment guides
└── .github/workflows/ # CI/CD pipelines
```

## 🚀 Quick Start

### Prerequisites

- **Bun** 1.3.1+
- **Node.js** 20+ (for some tools)
- **PostgreSQL** 18.0+ (local Docker instance)
- **Git**

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-org/i-know.git
cd i-know
```

2. Install dependencies:

```bash
bun install
```

3. Setup environment variables:

```bash
cp .env.example .env
# Edit .env with your database configuration
```

4. Setup database:

```bash
bun run db:migrate
bun run db:seed
```

5. Start development servers:

```bash
# Start all applications in parallel
bun run dev

# Or start individual services
bun run dev:web    # http://localhost:3000
bun run dev:api    # http://localhost:3001
bun run dev:scraper
```

## 📋 Available Scripts

### Development

- `bun run dev` - Start all applications in development mode
- `bun run dev:web` - Start web app only
- `bun run dev:api` - Start API only
- `bun run dev:scraper` - Start scraper only

### Building & Testing

- `bun run build` - Build all applications
- `bun run test` - Run all tests
- `bun run test:watch` - Run tests in watch mode
- `bun run test:e2e` - Run end-to-end tests
- `bun run type-check` - TypeScript type checking
- `bun run lint` - Run ESLint
- `bun run lint:fix` - Fix ESLint issues
- `bun run format` - Format code with Prettier

### Database

- `bun run db:migrate` - Run database migrations
- `bun run db:seed` - Seed database with sample data
- `bun run db:reset` - Reset database (migrate + seed)

### Utilities

- `bun run clean` - Clean build artifacts
- `bun run clean:all` - Deep clean including node_modules
- `bun run setup` - Complete fresh setup

## 🗄️ Database Setup

### Using Docker (Recommended)

1. Start PostgreSQL:

```bash
docker run --name i-know-postgres \
  -e POSTGRES_DB=i_know_development \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:18-alpine
```

2. Update your `.env` file:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/i_know_development
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=i_know_development
POSTGRES_HOST=localhost
```

### External PostgreSQL

Update your `.env` file with your PostgreSQL connection details.

## 🧪 Testing

### Running Tests

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run E2E tests
bun run test:e2e

# Run specific test file
bun test packages/utils/src/index.test.ts
```

### Test Structure

- **Unit Tests**: Co-located with source files (`*.test.ts`)
- **Integration Tests**: `tests/integration/`
- **E2E Tests**: `tests/e2e/`
- **Performance Tests**: `tests/performance/`

## 📝 Code Quality

### ESLint & Prettier

This project uses ESLint and Prettier for code consistency. Pre-commit hooks ensure code quality:

```bash
# Run linting
bun run lint

# Fix linting issues
bun run lint:fix

# Check formatting
bun run format:check

# Format code
bun run format
```

### Pre-commit Hooks

Husky and lint-staged are configured to run automatically on commit:

- ESLint with auto-fix
- Prettier formatting
- Type checking

## 🚢 Deployment

### Environment Variables

Copy `.env.example` to `.env` and configure:

- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - Environment (development/staging/production)
- `API_PORT` - API server port (default: 3001)
- `WEB_PORT` - Web app port (default: 3000)

### CI/CD

The project includes GitHub Actions workflows for:

- **Testing**: Automated testing on PRs
- **Security**: Dependency vulnerability scanning
- **Code Quality**: ESLint, Prettier, complexity analysis
- **Deployment**: Automatic deployment to staging/production

### Manual Deployment

1. Build for production:

```bash
bun run build
```

2. Deploy artifacts:

```bash
# Web app (static files)
# Deploy apps/web/dist/

# API (Bun executable)
# Deploy apps/api/dist/

# Scraper (Bun executable)
# Deploy apps/scraper/dist/
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Workflow

1. Ensure all tests pass: `bun run test`
2. Run type checking: `bun run type-check`
3. Check code quality: `bun run lint && bun run format:check`
4. Build successfully: `bun run build`

## 📚 Documentation

- [Development Guide](docs/development/README.md)
- [API Documentation](docs/development/api.md)
- [Database Schema](docs/development/database.md)
- [Deployment Guide](docs/deployment/README.md)
- [Troubleshooting](docs/deployment/troubleshooting.md)

## 🐛 Troubleshooting

### Common Issues

**Build fails with TypeScript errors**

```bash
bun run type-check
# Fix any type errors then retry build
```

**Tests fail**

```bash
bun run test:watch
# Check which tests are failing and fix them
```

**Database connection issues**

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
bun run db:migrate
```

### Getting Help

- Check the [troubleshooting guide](docs/deployment/troubleshooting.md)
- Search [GitHub Issues](https://github.com/your-org/i-know/issues)
- Create a new issue with detailed error information

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
