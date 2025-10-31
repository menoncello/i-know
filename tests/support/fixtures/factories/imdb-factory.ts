import { faker } from '@faker-js/faker';

// IMDB-specific data types
export interface Actor {
  id: string;
  name: string;
  biography: string;
  birthDate: string;
  placeOfBirth?: string;
  height?: string;
  filmography: FilmographyEntry[];
  awards: Award[];
  knownFor: string[];
  updatedAt: string;
}

export interface FilmographyEntry {
  title: string;
  year: string;
  role: string;
  type: 'movie' | 'tv' | 'short';
  rating?: number;
}

export interface Award {
  name: string;
  category: string;
  year: number;
  result: 'winner' | 'nominee';
}

export interface Content {
  id: string;
  title: string;
  year: string;
  genre: string[];
  director: string;
  cast: CastMember[];
  rating: number;
  ratingCount: number;
  synopsis: string;
  duration: string;
  releaseDate: string;
  country: string;
  language: string;
  keywords: string[];
  updatedAt: string;
}

export interface CastMember {
  actorId: string;
  name: string;
  role: string;
  billing: number;
}

export interface SearchResult {
  id: string;
  name: string;
  type: 'actor' | 'content';
  knownFor?: string[];
  year?: string;
  rating?: number;
  image?: string;
}

// Factory functions
export const createActor = (overrides: Partial<Actor> = {}): Actor => ({
  id: generateImdbId('actor'),
  name: faker.person.fullName(),
  biography: faker.lorem.paragraphs(3),
  birthDate: faker.date.past({ years: 50 }).toISOString().split('T')[0]!,
  placeOfBirth: faker.location.city(),
  height: `${faker.number.int({ min: 150, max: 200 })} cm`,
  filmography: createFilmographyEntries(faker.number.int({ min: 10, max: 50 })),
  awards: createAwards(faker.number.int({ min: 0, max: 10 })),
  knownFor: faker.helpers.arrayElements(['Drama', 'Action', 'Comedy', 'Thriller'], 2),
  updatedAt: faker.date.recent().toISOString(),
  ...overrides,
});

export const createContent = (overrides: Partial<Content> = {}): Content => ({
  id: generateImdbId('content'),
  title: `${faker.lorem.words(3)}: The ${faker.lorem.word()}`,
  year: faker.date.past({ years: 30 }).getFullYear().toString(),
  genre: faker.helpers.arrayElements(
    ['Drama', 'Action', 'Comedy', 'Thriller', 'Sci-Fi', 'Romance'],
    2,
  ),
  director: faker.person.fullName(),
  cast: createCastMembers(faker.number.int({ min: 5, max: 15 })),
  rating: faker.number.float({ min: 1, max: 10, fractionDigits: 1 }),
  ratingCount: faker.number.int({ min: 1000, max: 1000000 }),
  synopsis: faker.lorem.paragraphs(2),
  duration: `${faker.number.int({ min: 1, max: 3 })}h ${faker.number.int({ min: 0, max: 59 })}m`,
  releaseDate: faker.date.past({ years: 30 }).toISOString().split('T')[0]!,
  country: faker.location.country(),
  language: 'English',
  keywords: faker.helpers.arrayElements(['action', 'drama', 'romance', 'thriller'], 3),
  updatedAt: faker.date.recent().toISOString(),
  ...overrides,
});

export const createFilmographyEntry = (
  overrides: Partial<FilmographyEntry> = {},
): FilmographyEntry => ({
  title: faker.lorem.words(3),
  year: faker.date.past({ years: 20 }).getFullYear().toString(),
  role: faker.helpers.arrayElement(['Lead', 'Supporting', 'Cameo', 'Guest']),
  type: faker.helpers.arrayElement(['movie', 'tv', 'short']),
  rating: faker.number.float({ min: 1, max: 10, fractionDigits: 1 }),
  ...overrides,
});

export const createCastMember = (overrides: Partial<CastMember> = {}): CastMember => ({
  actorId: generateImdbId('actor'),
  name: faker.person.fullName(),
  role: faker.helpers.arrayElement(['Lead', 'Supporting', 'Cameo']),
  billing: faker.number.int({ min: 1, max: 10 }),
  ...overrides,
});

export const createAward = (overrides: Partial<Award> = {}): Award => ({
  name: faker.helpers.arrayElement(['Academy Award', 'Golden Globe', 'BAFTA', 'SAG Award']),
  category: faker.helpers.arrayElement([
    'Best Actor',
    'Best Supporting Actor',
    'Best Picture',
    'Best Director',
  ]),
  year: faker.number.int({ min: 1990, max: 2024 }),
  result: faker.helpers.arrayElement(['winner', 'nominee']),
  ...overrides,
});

export const createSearchResult = (overrides: Partial<SearchResult> = {}): SearchResult => ({
  id: generateImdbId(faker.helpers.arrayElement(['actor', 'content'])),
  name: faker.person.fullName(),
  type: faker.helpers.arrayElement(['actor', 'content']),
  knownFor: faker.helpers.arrayElements(['Drama', 'Action', 'Comedy'], 2),
  year: faker.date.past({ years: 20 }).getFullYear().toString(),
  rating: faker.number.float({ min: 1, max: 10, fractionDigits: 1 }),
  image: faker.image.url({ width: 100, height: 150 }),
  ...overrides,
});

// Helper functions for creating arrays
export const createFilmographyEntries = (count: number): FilmographyEntry[] =>
  Array.from({ length: count }, () => createFilmographyEntry());

export const createCastMembers = (count: number): CastMember[] =>
  Array.from({ length: count }, () => createCastMember());

export const createAwards = (count: number): Award[] =>
  Array.from({ length: count }, () => createAward());

export const createSearchResults = (count: number): SearchResult[] =>
  Array.from({ length: count }, () => createSearchResult());

// Specialized factories for test scenarios
export const createActorWithIncompleteData = (overrides: Partial<Actor> = {}): Actor => ({
  id: generateImdbId('actor'),
  name: faker.person.fullName(),
  biography: '', // Missing biography
  birthDate: faker.date.past().toISOString().split('T')[0]!,
  filmography: [], // Empty filmography
  awards: [],
  knownFor: [],
  updatedAt: faker.date.recent().toISOString(),
  ...overrides,
});

export const createContentWithInvalidRating = (overrides: Partial<Content> = {}): Content => ({
  id: generateImdbId('content'),
  title: faker.lorem.words(3),
  year: 'invalid-year', // Invalid year format
  genre: [''],
  director: '',
  cast: [],
  rating: 15, // Invalid rating (should be 0-10)
  ratingCount: -1, // Invalid count
  synopsis: faker.lorem.paragraph(),
  duration: 'invalid-duration',
  releaseDate: '',
  country: '',
  language: '',
  keywords: [],
  updatedAt: faker.date.recent().toISOString(),
  ...overrides,
});

export const createFamousActor = (overrides: Partial<Actor> = {}): Actor =>
  createActor({
    name: faker.helpers.arrayElement([
      'Leonardo DiCaprio',
      'Tom Hanks',
      'Meryl Streep',
      'Brad Pitt',
    ]),
    awards: createAwards(faker.number.int({ min: 5, max: 20 })),
    knownFor: ['Drama', 'Thriller', 'Action'],
    filmography: createFilmographyEntries(faker.number.int({ min: 30, max: 80 })),
    ...overrides,
  });

export const createHighRatedContent = (overrides: Partial<Content> = {}): Content =>
  createContent({
    rating: faker.number.float({ min: 8, max: 10, fractionDigits: 1 }),
    ratingCount: faker.number.int({ min: 500000, max: 2000000 }),
    genre: ['Drama', 'Thriller'],
    ...overrides,
  });

// Utility functions
function generateImdbId(type: 'actor' | 'content'): string {
  const prefix = type === 'actor' ? 'nm' : 'tt';
  const number = faker.number.int({ min: 1000000, max: 9999999 });
  return `${prefix}${number}`;
}

// Factory functions for API responses
export const createActorSearchResponse = (query: string, count: number = 10) => ({
  results: createSearchResults(count).map(result => ({
    ...result,
    type: 'actor' as const,
    name: result.name.includes(query) ? result.name : `${query} ${result.name}`,
  })),
  total: count,
  query,
  searchTime: faker.number.float({ min: 50, max: 200, fractionDigits: 0 }).toString(),
});

export const createContentSearchResponse = (query: string, count: number = 10) => ({
  results: createSearchResults(count).map(result => ({
    ...result,
    type: 'content' as const,
    title: result.name.includes(query) ? result.name : `${query} ${result.name}`,
  })),
  total: count,
  query,
  searchTime: faker.number.float({ min: 50, max: 200, fractionDigits: 0 }).toString(),
});

// Error response factories
export const createApiErrorResponse = (errorType: string, message: string) => ({
  error: errorType,
  message,
  timestamp: faker.date.recent().toISOString(),
  requestId: faker.string.uuid(),
  retryAfter: errorType === 'RATE_LIMIT' ? faker.number.int({ min: 60, max: 300 }) : undefined,
});

export const createValidationError = (field: string, value: any, expectedFormat: string) => ({
  ...createApiErrorResponse('VALIDATION_ERROR', `Invalid ${field} format`),
  details: {
    field,
    value,
    expectedFormat,
  },
});

export const createServiceUnavailableError = () =>
  createApiErrorResponse(
    'IMDB_SERVICE_UNAVAILABLE',
    'IMDB data service is temporarily unavailable',
  );
