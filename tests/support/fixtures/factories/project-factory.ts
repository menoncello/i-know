import { faker } from '@faker-js/faker';

// Types for project infrastructure
export type ProjectConfig = {
  id?: string;
  name: string;
  type: 'monorepo' | 'single-package';
  buildTool?: 'turborepo' | 'npm-workspaces' | 'yarn-workspaces';
  repositoryType?: 'gitflow' | 'github-flow' | 'trunk-based';
  ciProvider?: 'github-actions' | 'gitlab-ci' | 'jenkins';
  testFramework?: 'playwright' | 'jest' | 'vitest';
  deploymentTarget?: 'vercel' | 'netlify' | 'aws' | 'docker';
  environment?: 'development' | 'staging' | 'production';
  database?: 'postgresql' | 'mysql' | 'mongodb';
  apiSimulation?: 'msw' | 'mockoon' | 'json-server';
  codeQuality?: {
    linting: 'eslint';
    formatting: 'prettier';
    security: 'snyk' | 'audit-ci';
  };
  documentation?: {
    readme: boolean;
    contributing: boolean;
    deployment: boolean;
    api: boolean;
  };
  createdAt?: string;
};

export type Repository = {
  id?: string;
  name: string;
  owner: string;
  defaultBranch: string;
  branches: Branch[];
  protectionRules: ProtectionRule[];
  createdAt?: string;
};

export type Branch = {
  name: string;
  protected: boolean;
  default: boolean;
  lastCommit?: string;
};

export type ProtectionRule = {
  pattern: string;
  requiredReviews: number;
  requireUpToDate: boolean;
  enforceAdmins: boolean;
};

export type CIWorkflow = {
  id?: string;
  name: string;
  trigger: string[];
  jobs: CIJob[];
  environment?: string;
  createdAt?: string;
};

export type CIJob = {
  name: string;
  runsOn: string;
  needs?: string;
  steps: string[];
  timeout?: number;
  artifacts?: string[];
};

// Factory functions
export const createProjectConfig = (overrides: Partial<ProjectConfig> = {}): ProjectConfig => ({
  id: faker.string.uuid(),
  name: faker.helpers.arrayElement(['i-know', 'entertainment-platform', 'media-intel']),
  type: 'monorepo',
  buildTool: 'turborepo',
  repositoryType: 'gitflow',
  ciProvider: 'github-actions',
  testFramework: 'playwright',
  deploymentTarget: 'vercel',
  environment: 'development',
  database: 'postgresql',
  apiSimulation: 'msw',
  codeQuality: {
    linting: 'eslint',
    formatting: 'prettier',
    security: 'snyk',
  },
  documentation: {
    readme: true,
    contributing: true,
    deployment: true,
    api: true,
  },
  createdAt: faker.date.recent().toISOString(),
  ...overrides,
});

export const createRepository = (overrides: Partial<Repository> = {}): Repository => ({
  id: faker.string.uuid(),
  name: faker.helpers.arrayElement(['i-know', 'entertainment-platform', 'media-intel']),
  owner: faker.internet.userName(),
  defaultBranch: 'main',
  branches: [
    {
      name: 'main',
      protected: true,
      default: true,
      lastCommit: faker.git.commitSha(),
    },
    {
      name: 'develop',
      protected: false,
      default: false,
      lastCommit: faker.git.commitSha(),
    },
    {
      name: 'feature/template',
      protected: false,
      default: false,
      lastCommit: faker.git.commitSha(),
    },
  ],
  protectionRules: [
    {
      pattern: 'main',
      requiredReviews: 2,
      requireUpToDate: true,
      enforceAdmins: false,
    },
  ],
  createdAt: faker.date.past().toISOString(),
  ...overrides,
});

export const createCIWorkflow = (overrides: Partial<CIWorkflow> = {}): CIWorkflow => ({
  id: faker.string.uuid(),
  name: faker.helpers.arrayElement(['ci-cd', 'build-test-deploy', 'quality-gate']),
  trigger: ['push', 'pull_request'],
  jobs: [
    {
      name: 'test',
      runsOn: 'ubuntu-latest',
      steps: ['install', 'lint', 'test', 'build'],
      timeout: 600000,
      artifacts: ['test-results', 'coverage'],
    },
    {
      name: 'deploy',
      runsOn: 'ubuntu-latest',
      needs: 'test',
      steps: ['deploy-staging', 'deploy-production'],
      timeout: 300000,
    },
  ],
  environment: 'staging',
  createdAt: faker.date.recent().toISOString(),
  ...overrides,
});

export const createProjectConfigs = (count: number): ProjectConfig[] =>
  Array.from({ length: count }, () => createProjectConfig());

export const createRepositories = (count: number): Repository[] =>
  Array.from({ length: count }, () => createRepository());

export const createCIWorkflows = (count: number): CIWorkflow[] =>
  Array.from({ length: count }, () => createCIWorkflow());
