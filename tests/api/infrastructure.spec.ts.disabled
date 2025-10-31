import { testWithInfrastructure as test, expect } from '../support/fixtures';
import { createProjectConfig, createRepository, createCIWorkflow } from '../support/fixtures';

test.describe('Infrastructure API Tests', () => {
  test('should create monorepo structure with Turborepo', async ({ request }) => {
    // GIVEN: Story 1.1 Task 1 - Initialize monorepo structure with Turborepo
    const projectConfig = createProjectConfig({
      name: 'i-know',
      type: 'monorepo',
      buildTool: 'turborepo',
    });

    // WHEN: Creating monorepo structure via API
    const response = await request.post('/api/projects', {
      data: projectConfig,
    });

    expect(response.status()).toBe(201);

    const createdProject = await response.json();
    expect(createdProject.id).toBeTruthy();
    expect(createdProject.name).toBe('i-know');
    expect(createdProject.type).toBe('monorepo');

    // THEN: Verify monorepo structure is created
    const structureResponse = await request.get(`/api/projects/${createdProject.id}/structure`);
    expect(structureResponse.status()).toBe(200);

    const structure = await structureResponse.json();
    expect(structure.directories).toEqual(
      expect.arrayContaining(['apps/', 'packages/', 'tests/', 'docs/']),
    );

    // AND: Verify Turborepo configuration
    const turboConfigResponse = await request.get(
      `/api/projects/${createdProject.id}/files/turbo.json`,
    );
    expect(turboConfigResponse.status()).toBe(200);

    const turboConfig = await turboConfigResponse.json();
    expect(turboConfig.pipeline).toEqual(
      expect.objectContaining({
        build: {
          dependsOn: ['^build'],
          outputs: ['dist/**', '.next/**', '!.next/cache/**'],
        },
        test: {
          dependsOn: ['build'],
          outputs: ['coverage/**'],
        },
      }),
    );
  });

  test('should setup core applications with proper TypeScript configuration', async ({
    request,
  }) => {
    // GIVEN: Story 1.1 Task 2 - Setup core applications (web, api, scraper)
    const applications = [
      {
        name: 'web',
        framework: 'astro',
        language: 'typescript',
        port: 4321,
      },
      {
        name: 'api',
        framework: 'elysia',
        language: 'typescript',
        port: 3000,
      },
      {
        name: 'scraper',
        framework: 'bun',
        language: 'typescript',
        port: 3001,
      },
    ];

    for (const app of applications) {
      // WHEN: Creating each application
      const response = await request.post('/api/applications', {
        data: app,
      });

      expect(response.status()).toBe(201);

      const createdApp = await response.json();
      expect(createdApp.name).toBe(app.name);
      expect(createdApp.framework).toBe(app.framework);

      // THEN: Verify TypeScript configuration
      const tsConfigResponse = await request.get(`/api/applications/${createdApp.id}/tsconfig`);
      expect(tsConfigResponse.status()).toBe(200);

      const tsConfig = await tsConfigResponse.json();
      expect(tsConfig.compilerOptions).toEqual(
        expect.objectContaining({
          strict: true,
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
          typescript: expect.stringMatching(/^5\.9/),
        }),
      );
    }
  });

  test('should configure PostgreSQL database connection', async ({ request }) => {
    // GIVEN: Story 1.1 Task 3 - Connect to existing PostgreSQL Docker instance
    const dbConfig = {
      host: 'localhost',
      port: 5432,
      database: 'i-know-dev',
      username: 'postgres',
      password: 'postgres',
      ssl: false,
    };

    // WHEN: Testing database connection
    const response = await request.post('/api/database/test-connection', {
      data: dbConfig,
    });

    expect(response.status()).toBe(200);

    const connectionResult = await response.json();
    expect(connectionResult.connected).toBe(true);
    expect(connectionResult.version).toContain('18');

    // THEN: Verify database schema creation
    const schemaResponse = await request.post('/api/database/create-schema', {
      data: {
        database: dbConfig.database,
        schema: 'public',
      },
    });

    expect(schemaResponse.status()).toBe(201);

    const schema = await schemaResponse.json();
    expect(schema.tables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'users' }),
        expect.objectContaining({ name: 'entertainment_data' }),
        expect.objectContaining({ name: 'scraping_jobs' }),
      ]),
    );
  });

  test('should configure code quality tools', async ({ request }) => {
    // GIVEN: Story 1.1 Task 4 - Configure code quality tools
    const qualityTools = [
      { tool: 'eslint', config: 'typescript-strict' },
      { tool: 'prettier', config: 'default' },
      { tool: 'husky', config: 'pre-commit' },
      { tool: 'lint-staged', config: 'typescript' },
    ];

    for (const tool of qualityTools) {
      // WHEN: Configuring each tool
      const response = await request.post('/api/tools/configure', {
        data: tool,
      });

      expect(response.status()).toBe(200);

      const result = await response.json();
      expect(result.tool).toBe(tool.tool);
      expect(result.configured).toBe(true);

      // THEN: Verify configuration file exists and is valid
      const configResponse = await request.get(`/api/tools/${tool.tool}/config`);
      expect(configResponse.status()).toBe(200);

      const config = await configResponse.json();
      expect(config.valid).toBe(true);
      expect(config.exists).toBe(true);
    }

    // AND: Verify pre-commit hooks are configured
    const hooksResponse = await request.get('/api/tools/husky/hooks');
    expect(hooksResponse.status()).toBe(200);

    const hooks = await hooksResponse.json();
    expect(hooks.hooks).toEqual(
      expect.objectContaining({
        'pre-commit': expect.stringContaining('lint-staged'),
        'pre-push': expect.stringContaining('npm test'),
      }),
    );
  });

  test('should create GitHub Actions workflow', async ({ request }) => {
    // GIVEN: Story 1.1 Task 5 - Build CI/CD pipeline with GitHub Actions
    const ciWorkflow = createCIWorkflow({
      name: 'ci-cd',
      trigger: ['push', 'pull_request'],
      jobs: [
        {
          name: 'test',
          runsOn: 'ubuntu-latest',
          steps: ['install', 'lint', 'test', 'build'],
        },
        {
          name: 'deploy',
          runsOn: 'ubuntu-latest',
          needs: 'test',
          steps: ['deploy-staging', 'deploy-production'],
        },
      ],
    });

    // WHEN: Creating GitHub Actions workflow
    const response = await request.post('/api/github/workflows', {
      data: ciWorkflow,
    });

    expect(response.status()).toBe(201);

    const workflow = await response.json();
    expect(workflow.name).toBe('ci-cd');
    expect(workflow.path).toBe('.github/workflows/ci-cd.yml');

    // THEN: Verify workflow configuration
    const workflowResponse = await request.get(`/api/github/workflows/${workflow.id}`);
    expect(workflowResponse.status()).toBe(200);

    const workflowConfig = await workflowResponse.json();
    expect(workflowConfig.on).toEqual(
      expect.objectContaining({
        push: { branches: ['main', 'develop'] },
        pull_request: { branches: ['main'] },
      }),
    );

    // AND: Verify job configurations
    expect(workflowConfig.jobs).toEqual(
      expect.objectContaining({
        test: expect.objectContaining({
          'runs-on': 'ubuntu-latest',
          steps: expect.arrayContaining([
            expect.objectContaining({ name: 'Checkout code' }),
            expect.objectContaining({ name: 'Install dependencies' }),
            expect.objectContaining({ name: 'Run linting' }),
            expect.objectContaining({ name: 'Run tests' }),
            expect.objectContaining({ name: 'Build project' }),
          ]),
        }),
      }),
    );
  });

  test('should create comprehensive documentation', async ({ request }) => {
    // GIVEN: Story 1.1 Task 6 - Create development documentation
    const documentation = [
      { type: 'README', title: 'Project Setup and Development Guide' },
      { type: 'CONTRIBUTING', title: 'Contribution Guidelines' },
      { type: 'DEPLOYMENT', title: 'Deployment Procedures' },
      { type: 'API', title: 'API Documentation' },
      { type: 'ARCHITECTURE', title: 'System Architecture' },
    ];

    for (const doc of documentation) {
      // WHEN: Creating documentation
      const response = await request.post('/api/documentation', {
        data: doc,
      });

      expect(response.status()).toBe(201);

      const createdDoc = await response.json();
      expect(createdDoc.type).toBe(doc.type);
      expect(createdDoc.title).toBe(doc.title);

      // THEN: Verify documentation content
      const docResponse = await request.get(`/api/documentation/${createdDoc.id}`);
      expect(docResponse.status()).toBe(200);

      const content = await docResponse.json();
      expect(content.content).toContain(`# ${doc.title}`);
      expect(content.content).toContain('## Overview');

      if (doc.type === 'README') {
        expect(content.content).toContain('## Setup Instructions');
        expect(content.content).toContain('## Development Workflow');
      }
    }
  });
});
