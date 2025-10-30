import { test as base, mergeTests } from '@playwright/test';
import { UserFactory } from './factories/user-factory';
import { test as infrastructureTest, expect } from './infrastructure.fixture';

// Existing user fixtures
type UserTestFixtures = {
  userFactory: UserFactory;
};

export const test = base.extend<UserTestFixtures>({
  userFactory: async ({}, use) => {
    const factory = new UserFactory();
    await use(factory);
    await factory.cleanup(); // Auto-cleanup
  },
});

// Combined test fixtures (mergeTests pattern from fixture-architecture.md)
export const testWithInfrastructure = mergeTests(base, infrastructureTest, test);

// Re-exports
export { expect } from '@playwright/test';
export * from './infrastructure.fixture';
export * from './factories/project-factory';
