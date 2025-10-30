import { test, expect } from 'bun:test';
import { generateId, formatDate, parseDate, slugify, truncateText, sleep, retry } from './index';

test('generateId', () => {
  const id = generateId();
  expect(id).toBeDefined();
  expect(typeof id).toBe('string');
  expect(id).toMatch(/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i);
});

test('formatDate', () => {
  const date = new Date('2025-01-01T00:00:00Z');
  const formatted = formatDate(date);
  expect(formatted).toBe('2025-01-01T00:00:00.000Z');
});

test('parseDate', () => {
  const dateString = '2025-01-01T00:00:00.000Z';
  const parsed = parseDate(dateString);
  expect(parsed.toISOString()).toBe(dateString);
});

test('slugify', () => {
  expect(slugify('Hello World')).toBe('hello-world');
  expect(slugify('Hello World!')).toBe('hello-world');
  expect(slugify('  Hello   World  ')).toBe('hello-world');
  expect(slugify('Hello & World')).toBe('hello-world');
});

test('truncateText', () => {
  const text = 'This is a long text that should be truncated';
  expect(truncateText(text, 20)).toBe('This is a long te...');
  expect(truncateText('Short', 20)).toBe('Short');
});

test('sleep', async () => {
  const start = Date.now();
  await sleep(100);
  const end = Date.now();
  expect(end - start).toBeGreaterThanOrEqual(90); // Allow some margin
});

test('retry success', async () => {
  let attempts = 0;
  const fn = async () => {
    attempts++;
    if (attempts < 2) {
      throw new Error('Fail');
    }
    return 'success';
  };

  const result = await retry(fn, 3);
  expect(result).toBe('success');
  expect(attempts).toBe(2);
});

test('retry failure', async () => {
  const fn = async () => {
    throw new Error('Always fails');
  };

  expect(retry(fn, 2)).rejects.toThrow('Always fails');
});
