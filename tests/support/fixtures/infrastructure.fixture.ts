import { test as base, type APIRequestContext } from '@playwright/test';
import {
  createProjectConfig,
  createRepository,
  createCIWorkflow,
} from './factories/project-factory';

// Types
export type InfrastructureTestFixtures = {
  projectConfig: (overrides?: Record<string, unknown>) => ReturnType<typeof createProjectConfig>;
  repository: (overrides?: Record<string, unknown>) => ReturnType<typeof createRepository>;
  ciWorkflow: (overrides?: Record<string, unknown>) => ReturnType<typeof createCIWorkflow>;
  apiRequest: APIRequestContext;
};

// Extend base test with infrastructure fixtures
export const test = base.extend<InfrastructureTestFixtures>({
  // Project configuration fixture with auto-cleanup
  projectConfig: async ({}, use) => {
    const createdProjects: string[] = [];

    const createConfigWithCleanup = (overrides = {}) => {
      const config = createProjectConfig(overrides);
      createdProjects.push(config.id!);
      return config;
    };

    await use(createConfigWithCleanup);

    // Cleanup: Remove created projects via API
    for (const projectId of createdProjects) {
      // In real implementation, this would call actual API cleanup
      console.log(`Cleaning up project: ${projectId}`);
    }
    createdProjects.length = 0;
  },

  // Repository fixture with auto-cleanup
  repository: async ({}, use) => {
    const createdRepos: string[] = [];

    const createRepoWithCleanup = (overrides = {}) => {
      const repo = createRepository(overrides);
      createdRepos.push(repo.id!);
      return repo;
    };

    await use(createRepoWithCleanup);

    // Cleanup: Remove created repositories via API
    for (const repoId of createdRepos) {
      // In real implementation, this would call actual GitHub API cleanup
      console.log(`Cleaning up repository: ${repoId}`);
    }
    createdRepos.length = 0;
  },

  // CI Workflow fixture with auto-cleanup
  ciWorkflow: async ({}, use) => {
    const createdWorkflows: string[] = [];

    const createWorkflowWithCleanup = (overrides = {}) => {
      const workflow = createCIWorkflow(overrides);
      createdWorkflows.push(workflow.id!);
      return workflow;
    };

    await use(createWorkflowWithCleanup);

    // Cleanup: Remove created workflows via API
    for (const workflowId of createdWorkflows) {
      // In real implementation, this would call actual CI API cleanup
      console.log(`Cleaning up workflow: ${workflowId}`);
    }
    createdWorkflows.length = 0;
  },

  // API Request context fixture
  apiRequest: async ({ request }, use) => {
    // Add any API-specific setup here
    // For example, authentication headers, base URLs, etc.

    await use(request);

    // Cleanup happens automatically with Playwright's request context
  },
});

// Re-export expect for convenience
export { expect } from '@playwright/test';
