import { test, expect } from 'bun:test';

test('monorepo build', async () => {
  // Test that we can build the monorepo
  const result = await Bun.spawn(['bun', 'run', 'build']).exited;
  expect(result).toBe(0);
});

test('type checking', async () => {
  // Test that TypeScript passes
  const result = await Bun.spawn(['bun', 'run', 'type-check']).exited;
  expect(result).toBe(0);
});
