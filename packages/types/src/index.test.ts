import { test, expect } from 'bun:test';
import type {
  Actor,
  Content,
  ActorDetection,
  User,
  UserPreferences,
  APIResponse,
  SearchResult,
} from './index';

test('type definitions', () => {
  // Test that types can be instantiated
  const actor: Actor = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Actor',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  expect(actor.id).toBe('123e4567-e89b-12d3-a456-426614174000');
  expect(actor.name).toBe('Test Actor');

  const content: Content = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    type: 'movie',
    title: 'Test Movie',
    actors: [actor],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  expect(content.type).toBe('movie');
  expect(content.title).toBe('Test Movie');

  const apiResponse: APIResponse<Actor> = {
    success: true,
    data: actor,
  };

  expect(apiResponse.success).toBe(true);
  expect(apiResponse.data).toBe(actor);
});

test('type constraints', () => {
  // Test that Content type constraints are enforced
  const content: Content = {
    id: 'test',
    type: 'movie', // Valid type
    title: 'Test',
    actors: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  expect(['movie', 'tv', 'documentary']).toContain(content.type);
});
