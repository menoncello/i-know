import { testWithInfrastructure as test, expect } from '../support/fixtures';
import { createProjectConfig, createRepository } from '../support/fixtures';

test.describe('Project Infrastructure Setup', () => {
  test.describe.configure({ mode: 'serial' }); // Repository setup affects global state

  test('should initialize repository with proper branching strategy', async ({ request }) => {
    // GIVEN: Story 1.1 AC1 - Repository initialized with proper branching strategy
    const projectConfig = createProjectConfig({
      name: 'i-know',
      repositoryType: 'gitflow',
    });

    // WHEN: Checking repository structure via GitHub API
    const branchesResponse = await request.get('/api/repos/i-known/branches');
    expect(branchesResponse.status()).toBe(200);

    const branches = await branchesResponse.json();

    // THEN: Required branches exist with proper naming
    expect(branches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'main' }),
        expect.objectContaining({ name: 'develop' }),
        expect.objectContaining({ name: 'feature/template' }),
      ]),
    );

    // AND: Branch protection rules are configured
    const mainBranch = branches.find((b: any) => b.name === 'main');
    expect(mainBranch.protected).toBe(true);
  });

  test('should configure CI/CD pipeline with automated testing', async ({ request }) => {
    // GIVEN: Story 1.1 AC2 - CI/CD pipeline configured with automated testing and deployment
    const projectConfig = createProjectConfig({
      ciProvider: 'github-actions',
      testFramework: 'playwright',
      deploymentTarget: 'vercel',
    });

    // WHEN: Checking GitHub Actions workflows
    const workflowsResponse = await request.get('/api/repos/i-known/actions/workflows');
    expect(workflowsResponse.status()).toBe(200);

    const workflows = await workflowsResponse.json();

    // THEN: Critical workflows exist and are enabled
    expect(workflows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'ci.yml',
          state: 'active',
        }),
        expect.objectContaining({
          name: 'deploy.yml',
          state: 'active',
        }),
      ]),
    );

    // AND: CI workflow includes required jobs
    const ciWorkflowResponse = await request.get(
      '/api/repos/i-known/actions/workflows/ci.yml/jobs',
    );
    const ciJobs = await ciWorkflowResponse.json();

    expect(ciJobs.jobs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'test' }),
        expect.objectContaining({ name: 'lint' }),
        expect.objectContaining({ name: 'security-scan' }),
      ]),
    );
  });

  test('should setup development environment with local database', async ({ request }) => {
    // GIVEN: Story 1.1 AC3 - Development environment setup with local database and API simulation
    const envConfig = createProjectConfig({
      environment: 'development',
      database: 'postgresql',
      apiSimulation: 'msw',
    });

    // WHEN: Checking development configuration
    const envResponse = await request.get('/api/projects/i-known/env/development');
    expect(envResponse.status()).toBe(200);

    const envData = await envResponse.json();

    // THEN: Database is configured and accessible
    expect(envData.database).toEqual(
      expect.objectContaining({
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        name: expect.stringMatching(/i-know-dev/),
      }),
    );

    // AND: API simulation is configured
    expect(envData.apiSimulation).toEqual(
      expect.objectContaining({
        provider: 'msw',
        enabled: true,
        port: 3001,
      }),
    );

    // AND: Environment variables are properly set
    expect(envData.environment).toEqual(
      expect.objectContaining({
        NODE_ENV: 'development',
        BASE_URL: 'http://localhost:4321',
        API_URL: 'http://localhost:3000/api',
      }),
    );
  });

  test('should configure code quality tools', async ({ request }) => {
    // GIVEN: Story 1.1 AC4 - Code quality tools configured (linting, formatting, security scanning)
    const projectConfig = createProjectConfig({
      codeQuality: {
        linting: 'eslint',
        formatting: 'prettier',
        security: 'snyk',
      },
    });

    // WHEN: Checking code quality configuration files
    const configFilesResponse = await request.get('/api/projects/i-known/config-files');
    expect(configFilesResponse.status()).toBe(200);

    const configFiles = await configFilesResponse.json();

    // THEN: All required configuration files exist
    expect(configFiles.files).toEqual(
      expect.arrayContaining(['.eslintrc.json', '.prettierrc', '.snyk', 'tsconfig.json']),
    );

    // AND: ESLint configuration includes strict TypeScript rules
    const eslintConfig = configFiles.files.find((f: any) => f.name === '.eslintrc.json');
    expect(eslintConfig.content).toContain('@typescript-eslint/recommended');
    expect(eslintConfig.content).toContain(
      '@typescript-eslint/recommended-requiring-type-checking',
    );

    // AND: Prettier configuration is consistent
    const prettierConfig = configFiles.files.find((f: any) => f.name === '.prettierrc');
    expect(JSON.parse(prettierConfig.content)).toEqual(
      expect.objectContaining({
        semi: true,
        trailingComma: 'es5',
        singleQuote: true,
        printWidth: 80,
        tabWidth: 2,
      }),
    );
  });

  test('should create development documentation', async ({ request }) => {
    // GIVEN: Story 1.1 AC5 - Documentation for development workflow and deployment procedures
    const projectConfig = createProjectConfig({
      documentation: {
        readme: true,
        contributing: true,
        deployment: true,
        api: true,
      },
    });

    // WHEN: Checking documentation files
    const docsResponse = await request.get('/api/projects/i-known/docs');
    expect(docsResponse.status()).toBe(200);

    const docs = await docsResponse.json();

    // THEN: All required documentation exists
    expect(docs.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'README.md', type: 'documentation' }),
        expect.objectContaining({ name: 'CONTRIBUTING.md', type: 'documentation' }),
        expect.objectContaining({ name: 'DEPLOYMENT.md', type: 'documentation' }),
        expect.objectContaining({ name: 'docs/API.md', type: 'documentation' }),
      ]),
    );

    // AND: README contains required sections
    const readme = docs.files.find((f: any) => f.name === 'README.md');
    expect(readme.content).toContain('## Setup Instructions');
    expect(readme.content).toContain('## Development Workflow');
    expect(readme.content).toContain('## Deployment Procedures');
  });

  test('should configure environment-specific settings', async ({ request }) => {
    // GIVEN: Story 1.1 AC6 - Environment-specific configuration management
    const environments = ['development', 'staging', 'production'];

    for (const env of environments) {
      // WHEN: Checking each environment configuration
      const envResponse = await request.get(`/api/projects/i-known/env/${env}`);
      expect(envResponse.status()).toBe(200);

      const envData = await envResponse.json();

      // THEN: Each environment has proper configuration
      expect(envData.environment).toEqual(
        expect.objectContaining({
          name: env,
          type: expect.stringMatching(/^(development|staging|production)$/),
          config: expect.objectContaining({
            database: expect.objectContaining({
              url: expect.stringContaining(env),
              ssl: env === 'production',
            }),
            api: expect.objectContaining({
              timeout: expect.any(Number),
              retries: expect.any(Number),
            }),
            features: expect.any(Object),
          }),
        }),
      );

      // AND: Security configurations are appropriate for environment
      if (env === 'production') {
        expect(envData.environment.config.security).toEqual(
          expect.objectContaining({
            rateLimiting: true,
            cors: expect.objectContaining({
              strict: true,
            }),
            helmet: true,
          }),
        );
      }
    }
  });
});
