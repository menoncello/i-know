# ATDD Checklist - Epic 1, Story 1.1: Project Setup and Development Infrastructure

**Date:** 2025-10-30
**Author:** Eduardo Menoncello
**Primary Test Level:** Integration Tests (API-level)

---

## Story Summary

Story 1.1 focuses on establishing the complete project infrastructure for the I Know entertainment intelligence platform. This includes setting up a monorepo structure with Turborepo, configuring CI/CD pipelines, establishing development environments, implementing code quality tools, and creating comprehensive documentation.

**As a** development team
**I want** a complete project infrastructure with CI/CD, version control, and development environment
**So that** we can build and deploy the application efficiently and reliably

---

## Acceptance Criteria

1. Repository initialized with proper branching strategy (main, develop, feature branches)
2. CI/CD pipeline configured with automated testing and deployment
3. Development environment setup with local database and API simulation
4. Code quality tools configured (linting, formatting, security scanning)
5. Documentation for development workflow and deployment procedures
6. Environment-specific configuration management (development, staging, production)

---

## Failing Tests Created (RED Phase)

### E2E Tests (6 tests)

**File:** `tests/e2e/project-setup.spec.ts` (185 lines)

- ✅ **Test:** should initialize repository with proper branching strategy
  - **Status:** RED - GitHub API endpoints not implemented
  - **Verifies:** Repository has main, develop, and feature template branches with protection rules

- ✅ **Test:** should configure CI/CD pipeline with automated testing
  - **Status:** RED - GitHub Actions workflows not created
  - **Verifies:** CI/CD pipeline has required jobs (test, lint, security-scan) and is active

- ✅ **Test:** should setup development environment with local database
  - **Status:** RED - Development environment API not implemented
  - **Verifies:** PostgreSQL connection and API simulation configuration

- ✅ **Test:** should configure code quality tools
  - **Status:** RED - Code quality configuration files not created
  - **Verifies:** ESLint, Prettier, and security scanning tools are properly configured

- ✅ **Test:** should create development documentation
  - **Status:** RED - Documentation files not generated
  - **Verifies:** Required documentation files exist with proper content

- ✅ **Test:** should configure environment-specific settings
  - **Status:** RED - Environment configuration API not implemented
  - **Verifies:** Each environment has appropriate configuration and security settings

### API Tests (6 tests)

**File:** `tests/api/infrastructure.spec.ts` (215 lines)

- ✅ **Test:** should create monorepo structure with Turborepo
  - **Status:** RED - Monorepo creation API not implemented
  - **Verifies:** Turborepo configuration and proper directory structure

- ✅ **Test:** should setup core applications with proper TypeScript configuration
  - **Status:** RED - Application setup API not implemented
  - **Verifies:** Web (Astro), API (Elysia), and Scraper (Bun) applications with TypeScript config

- ✅ **Test:** should configure PostgreSQL database connection
  - **Status:** RED - Database configuration API not implemented
  - **Verifies:** PostgreSQL connection and schema creation

- ✅ **Test:** should configure code quality tools
  - **Status:** RED - Code quality tools API not implemented
  - **Verifies:** ESLint, Prettier, Husky, and lint-staged configuration

- ✅ **Test:** should create GitHub Actions workflow
  - **Status:** RED - GitHub Actions API not implemented
  - **Verifies:** CI/CD workflow with proper jobs and triggers

- ✅ **Test:** should create comprehensive documentation
  - **Status:** RED - Documentation generation API not implemented
  - **Verifies:** All required documentation files are created with proper content

### Component Tests (0 tests)

No component tests created for this infrastructure story as it primarily involves backend/setup tasks rather than UI components.

---

## Data Factories Created

### Project Infrastructure Factory

**File:** `tests/support/fixtures/factories/project-factory.ts`

**Exports:**

- `createProjectConfig(overrides?)` - Create project configuration with optional overrides
- `createRepository(overrides?)` - Create repository configuration with branches
- `createCIWorkflow(overrides?)` - Create CI/CD workflow configuration
- `createProjectConfigs(count)` - Create array of project configurations
- `createRepositories(count)` - Create array of repository configurations
- `createCIWorkflows(count)` - Create array of CI workflow configurations

**Example Usage:**

```typescript
const projectConfig = createProjectConfig({
  name: 'i-know',
  buildTool: 'turborepo',
});
const repository = createRepository({
  defaultBranch: 'main',
});
const workflows = createCIWorkflows(3); // Generate 3 workflows
```

---

## Fixtures Created

### Infrastructure Fixtures

**File:** `tests/support/fixtures/infrastructure.fixture.ts`

**Fixtures:**

- `projectConfig` - Project configuration factory with auto-cleanup
  - **Setup:** Creates project configuration using factory
  - **Provides:** Configured project configuration object
  - **Cleanup:** Removes created projects via API

- `repository` - Repository configuration factory with auto-cleanup
  - **Setup:** Creates repository configuration with branches
  - **Provides:** Repository with branches and protection rules
  - **Cleanup:** Removes created repositories via API

- `ciWorkflow` - CI workflow factory with auto-cleanup
  - **Setup:** Creates CI/CD workflow configuration
  - **Provides:** Workflow with jobs and triggers
  - **Cleanup:** Removes created workflows via API

- `apiRequest` - API request context for testing
  - **Setup:** Configures API request context
  - **Provides:** Playwright APIRequestContext for API calls
  - **Cleanup:** Automatic cleanup handled by Playwright

**Example Usage:**

```typescript
import { testWithInfrastructure } from './fixtures/infrastructure.fixture';

testWithInfrastructure('should create project', async ({ projectConfig, apiRequest }) => {
  const config = projectConfig({ name: 'test-project' });
  const response = await apiRequest.post('/api/projects', { data: config });
  await expect(response).toBeOK();
});
```

---

## Mock Requirements

### GitHub API Mock

**Endpoint:** `GET /api/repos/{owner}/{repo}/branches`

**Success Response:**

```json
[
  {
    "name": "main",
    "protected": true,
    "default": true
  },
  {
    "name": "develop",
    "protected": false,
    "default": false
  },
  {
    "name": "feature/template",
    "protected": false,
    "default": false
  }
]
```

**Failure Response:**

```json
{
  "message": "Not Found",
  "documentation_url": "https://docs.github.com/rest/reference/repos#list-branches"
}
```

**Notes:** Mock should simulate GitHub API rate limiting and authentication

### GitHub Actions API Mock

**Endpoint:** `GET /api/repos/{owner}/{repo}/actions/workflows`

**Success Response:**

```json
{
  "total_count": 2,
  "workflows": [
    {
      "id": 12345,
      "name": "ci.yml",
      "path": ".github/workflows/ci.yml",
      "state": "active",
      "created_at": "2025-10-30T10:00:00Z",
      "updated_at": "2025-10-30T10:00:00Z"
    },
    {
      "id": 67890,
      "name": "deploy.yml",
      "path": ".github/workflows/deploy.yml",
      "state": "active",
      "created_at": "2025-10-30T10:00:00Z",
      "updated_at": "2025-10-30T10:00:00Z"
    }
  ]
}
```

**Notes:** Mock should include workflow file content and job details

### Database API Mock

**Endpoint:** `POST /api/database/test-connection`

**Success Response:**

```json
{
  "connected": true,
  "version": "PostgreSQL 18.0",
  "latency_ms": 12,
  "database": "i-know-dev"
}
```

**Failure Response:**

```json
{
  "connected": false,
  "error": "Connection refused",
  "error_code": "ECONNREFUSED"
}
```

**Notes:** Mock should simulate different database states and connection issues

---

## Required data-testid Attributes

No UI components are involved in this infrastructure story, so no data-testid attributes are required.

---

## Implementation Checklist

### Test: should initialize repository with proper branching strategy

**File:** `tests/e2e/project-setup.spec.ts`

**Tasks to make this test pass:**

- [ ] Initialize Git repository with proper structure
- [ ] Create main branch with initial commit
- [ ] Create develop branch from main
- [ ] Create feature/template branch with project templates
- [ ] Configure branch protection rules for main branch
- [ ] Set up proper .gitignore file for monorepo
- [ ] Configure commit hooks for code quality
- [ ] Run test: `bun run test:e2e tests/e2e/project-setup.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

### Test: should configure CI/CD pipeline with automated testing

**File:** `tests/e2e/project-setup.spec.ts`

**Tasks to make this test pass:**

- [ ] Create .github/workflows directory structure
- [ ] Implement ci.yml workflow with test, lint, security-scan jobs
- [ ] Implement deploy.yml workflow with staging and production deployment
- [ ] Configure workflow triggers (push, pull_request)
- [ ] Set up GitHub Actions secrets for deployment
- [ ] Configure workflow artifacts and reports
- [ ] Add workflow status badges to README
- [ ] Run test: `bun run test:e2e tests/e2e/project-setup.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 6 hours

---

### Test: should setup development environment with local database

**File:** `tests/e2e/project-setup.spec.ts`

**Tasks to make this test pass:**

- [ ] Connect to existing PostgreSQL Docker instance
- [ ] Create development database schema
- [ ] Configure database connection in environment files
- [ ] Set up API simulation with MSW or similar
- [ ] Create database migration scripts
- [ ] Implement database seeding for development
- [ ] Configure local development scripts
- [ ] Run test: `bun run test:e2e tests/e2e/project-setup.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 5 hours

---

### Test: should configure code quality tools

**File:** `tests/e2e/project-setup.spec.ts`

**Tasks to make this test pass:**

- [ ] Install and configure ESLint with TypeScript rules
- [ ] Install and configure Prettier with team standards
- [ ] Set up Husky for Git hooks
- [ ] Configure lint-staged for pre-commit hooks
- [ ] Install security scanning tools (Snyk)
- [ ] Create code quality configuration files
- [ ] Add pre-commit and pre-push hooks
- [ ] Run test: `bun run test:e2e tests/e2e/project-setup.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

### Test: should create development documentation

**File:** `tests/e2e/project-setup.spec.ts`

**Tasks to make this test pass:**

- [ ] Create comprehensive README.md with setup instructions
- [ ] Write CONTRIBUTING.md with development workflow
- [ ] Create DEPLOYMENT.md with deployment procedures
- [ ] Generate API documentation
- [ ] Create architecture documentation
- [ ] Add troubleshooting guide
- [ ] Create developer onboarding checklist
- [ ] Run test: `bun run test:e2e tests/e2e/project-setup.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

### Test: should configure environment-specific settings

**File:** `tests/e2e/project-setup.spec.ts`

**Tasks to make this test pass:**

- [ ] Create .env.example template file
- [ ] Configure development environment variables
- [ ] Set up staging environment configuration
- [ ] Configure production environment settings
- [ ] Implement environment-specific database connections
- [ ] Set up feature flag configuration
- [ ] Create environment validation script
- [ ] Run test: `bun run test:e2e tests/e2e/project-setup.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

### Test: should create monorepo structure with Turborepo

**File:** `tests/api/infrastructure.spec.ts`

**Tasks to make this test pass:**

- [ ] Initialize Turborepo configuration (turbo.json)
- [ ] Create apps/ directory structure
- [ ] Create packages/ directory structure
- [ ] Set up workspace configuration (package.json)
- [ ] Configure pnpm-workspace.yaml
- [ ] Create shared packages (ui, types, database, utils)
- [ ] Set up inter-package dependencies
- [ ] Run test: `bun run test:api tests/api/infrastructure.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 5 hours

---

### Test: should setup core applications with proper TypeScript configuration

**File:** `tests/api/infrastructure.spec.ts`

**Tasks to make this test pass:**

- [ ] Initialize Astro web application with React
- [ ] Create Elysia backend API with TypeScript
- [ ] Set up Bun scraper service
- [ ] Configure TypeScript for all applications
- [ ] Set up shared TypeScript types
- [ ] Configure application entry points
- [ ] Set up application dependencies
- [ ] Run test: `bun run test:api tests/api/infrastructure.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 6 hours

---

### Test: should configure PostgreSQL database connection

**File:** `tests/api/infrastructure.spec.ts`

**Tasks to make this test pass:**

- [ ] Create database connection utilities
- [ ] Implement database schema definitions
- [ ] Set up database migration system
- [ ] Create database seeding utilities
- [ ] Configure connection pooling
- [ ] Set up database health checks
- [ ] Create database backup procedures
- [ ] Run test: `bun run test:api tests/api/infrastructure.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

### Test: should configure code quality tools

**File:** `tests/api/infrastructure.spec.ts`

**Tasks to make this test pass:**

- [ ] Create ESLint configuration with strict TypeScript rules
- [ ] Set up Prettier configuration
- [ ] Configure Husky Git hooks
- [ ] Set up lint-staged configuration
- [ ] Create security scanning configuration
- [ ] Add code quality scripts to package.json
- [ ] Configure automated code quality checks
- [ ] Run test: `bun run test:api tests/api/infrastructure.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

### Test: should create GitHub Actions workflow

**File:** `tests/api/infrastructure.spec.ts`

**Tasks to make this test pass:**

- [ ] Create GitHub Actions workflow files
- [ ] Configure CI pipeline with test and build steps
- [ ] Set up deployment pipeline
- [ ] Configure workflow secrets and environment variables
- [ ] Set up workflow artifacts and caching
- [ ] Configure workflow notifications
- [ ] Create workflow status reporting
- [ ] Run test: `bun run test:api tests/api/infrastructure.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 5 hours

---

### Test: should create comprehensive documentation

**File:** `tests/api/infrastructure.spec.ts`

**Tasks to make this test pass:**

- [ ] Create API documentation generation system
- [ ] Set up documentation build process
- [ ] Create documentation templates
- [ ] Configure automatic documentation updates
- [ ] Set up documentation deployment
- [ ] Create documentation maintenance procedures
- [ ] Add documentation quality checks
- [ ] Run test: `bun run test:api tests/api/infrastructure.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 4 hours

---

## Running Tests

```bash
# Run all failing tests for this story
bun run test:e2e tests/e2e/project-setup.spec.ts && bun run test:api tests/api/infrastructure.spec.ts

# Run specific test file
bun run test:e2e tests/e2e/project-setup.spec.ts

# Run tests in headed mode (see browser)
bun run test:e2e tests/e2e/project-setup.spec.ts --headed

# Debug specific test
bun run test:e2e tests/e2e/project-setup.spec.ts --debug

# Run tests with coverage
bun run test:e2e tests/e2e/project-setup.spec.ts --coverage
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing
- ✅ Fixtures and factories created with auto-cleanup
- ✅ Mock requirements documented
- ✅ data-testid requirements listed (none for infrastructure story)
- ✅ Implementation checklist created

**Verification:**

- All tests run and fail as expected
- Failure messages are clear and actionable
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with highest priority)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

**Progress Tracking:**

- Check off tasks as you complete them
- Share progress in daily standup
- Mark story as IN PROGRESS in `bmm-workflow-status.md`

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all tests pass** (green phase complete)
2. **Review code for quality** (readability, maintainability, performance)
3. **Extract duplications** (DRY principle)
4. **Optimize performance** (if needed)
5. **Ensure tests still pass** after each refactor
6. **Update documentation** (if API contracts change)

**Key Principles:**

- Tests provide safety net (refactor with confidence)
- Make small refactors (easier to debug if tests fail)
- Run tests after each change
- Don't change test behavior (only implementation)

**Completion:**

- All tests pass
- Code quality meets team standards
- No duplications or code smells
- Ready for code review and story approval

---

## Next Steps

1. **Review this checklist** with team in standup or planning
2. **Run failing tests** to confirm RED phase: `bun run test:e2e tests/e2e/project-setup.spec.ts && bun run test:api tests/api/infrastructure.spec.ts`
3. **Begin implementation** using implementation checklist as guide
4. **Work one test at a time** (red → green for each)
5. **Share progress** in daily standup
6. **When all tests pass**, refactor code for quality
7. **When refactoring complete**, run `bmad sm story-done` to move story to DONE

---

## Knowledge Base References Applied

This ATDD workflow consulted the following knowledge fragments:

- **fixture-architecture.md** - Test fixture patterns with setup/teardown and auto-cleanup using Playwright's `test.extend()`
- **data-factories.md** - Factory patterns using `@faker-js/faker` for random test data generation with overrides support
- **component-tdd.md** - Component test strategies using Playwright Component Testing
- **network-first.md** - Route interception patterns (intercept BEFORE navigation to prevent race conditions)
- **test-quality.md** - Test design principles (Given-When-Then, one assertion per test, determinism, isolation)
- **test-levels-framework.md** - Test level selection framework (E2E vs API vs Component vs Unit)

See `tea-index.csv` for complete knowledge fragment mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `bun run test:e2e tests/e2e/project-setup.spec.ts && bun run test:api tests/api/infrastructure.spec.ts`

**Results:**

```
Running tests for Story 1.1...

tests/e2e/project-setup.spec.ts:12:9 › should initialize repository with proper branching strategy
    ❌ Test timeout of 60000ms exceeded.
    Error: APIRequestContext.get: Request to /api/repos/i-known/branches timed out.

tests/e2e/project-setup.spec.ts:35:9 › should configure CI/CD pipeline with automated testing
    ❌ Test timeout of 60000ms exceeded.
    Error: APIRequestContext.get: Request to /api/repos/i-known/actions/workflows timed out.

tests/e2e/project-setup.spec.ts:65:9 › should setup development environment with local database
    ❌ Test timeout of 60000ms exceeded.
    Error: APIRequestContext.get: Request to /api/projects/i-known/env/development timed out.

tests/api/infrastructure.spec.ts:8:9 › should create monorepo structure with Turborepo
    ❌ Test timeout of 60000ms exceeded.
    Error: APIRequestContext.post: Request to /api/projects timed out.

tests/api/infrastructure.spec.ts:45:9 › should setup core applications with proper TypeScript configuration
    ❌ Test timeout of 60000ms exceeded.
    Error: APIRequestContext.post: Request to /api/applications timed out.

[All 12 tests failing as expected]
```

**Summary:**

- Total tests: 12
- Passing: 0 (expected)
- Failing: 12 (expected)
- Status: ✅ RED phase verified

**Expected Failure Messages:**

- API timeouts for non-existent endpoints (infrastructure not yet implemented)
- 404 errors for missing configuration files
- Connection errors for unimplemented APIs

---

## Notes

- This is an infrastructure setup story with no UI components, hence no data-testid requirements
- All failures are expected as the infrastructure does not exist yet
- Tests focus on API-level validation rather than UI interactions
- Factory pattern allows for flexible test data generation
- Fixtures provide automatic cleanup to prevent test pollution

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Tag @tea-agent in Slack/Discord
- Refer to `testarch/README.md` for workflow documentation
- Consult `testarch/knowledge/` for testing best practices

---

**Generated by BMad TEA Agent** - 2025-10-30
