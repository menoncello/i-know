/**
 * IMDB Data Pipeline Type Definitions
 * Comprehensive type definitions for IMDB actor and content data
 */

// Base entity with common fields
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Actor data structure
export interface Actor extends BaseEntity {
  name: string;
  bio?: string;
  birthDate?: Date;
  photoUrl?: string;
  profileImageUrl?: string;
  imdbId?: string;
  imdbUrl?: string;
  knownForTitles?: string[];
  awards?: Record<string, any>;
  filmographyCount?: number;
  birthPlace?: string;
  heightInches?: number;
  nationality?: string;
  lastSyncedAt?: Date;
  metadata: Record<string, any>;
}

// Content (movie/TV show) data structure
export interface Content extends BaseEntity {
  imdbId: string;
  title: string;
  year?: number;
  mediaType:
    | 'movie'
    | 'tv_series'
    | 'tv_movie'
    | 'tv_special'
    | 'tv_miniseries'
    | 'video_game'
    | 'video'
    | 'short';
  genre?: string[];
  description?: string;
  durationMinutes?: number;
  rating?: number;
  posterUrl?: string;
  trailerUrl?: string;
  director?: string[];
  castActors?: string[];
  releaseDate?: Date;
  language?: string[];
  country?: string[];
  awards?: Record<string, any>;
  boxOffice?: number;
  lastSyncedAt?: Date;
  metadata: Record<string, any>;
}

// Actor-Content relationship
export interface ActorContent extends BaseEntity {
  actorId: string;
  contentId: string;
  roleName?: string;
  characterName?: string;
  isMainCast: boolean;
  orderInCredits?: number;
  metadata: Record<string, any>;
}

// IMDB Sync tracking
export interface IMDBSyncLog extends BaseEntity {
  syncType: 'actor' | 'content' | 'full_sync' | 'cache_refresh';
  entityType?: 'actor' | 'content';
  entityId?: string;
  status: 'success' | 'failed' | 'partial' | 'in_progress';
  recordsProcessed?: number;
  recordsUpdated?: number;
  recordsAdded?: number;
  errorMessage?: string;
  syncStartedAt: Date;
  syncCompletedAt?: Date;
  metadata: Record<string, any>;
}

// Cache entry for performance
export interface CacheEntry extends BaseEntity {
  cacheKey: string;
  cacheValue: Record<string, any>;
  expiresAt: Date;
  hitCount: number;
  lastAccessedAt: Date;
}

// Performance metrics
export interface PerformanceMetric {
  id: string;
  metricType: 'api_response_time' | 'cache_hit_rate' | 'db_query_time' | 'external_api_time';
  endpoint?: string;
  value: number;
  unit: 'ms' | 'percent' | 'count';
  metadata: Record<string, any>;
  recordedAt: Date;
}

// API request/response types
export interface ActorSearchRequest {
  query: string;
  limit?: number;
  offset?: number;
  includeFilmography?: boolean;
}

export interface ActorSearchResponse {
  success: boolean;
  data: {
    actors: Actor[];
    total: number;
    query: string;
    took: number; // milliseconds
  };
  error?: string;
  metadata: {
    source: 'imdb' | 'cache' | 'database';
    timestamp: string;
    cached: boolean;
  };
}

export interface ActorProfileRequest {
  actorId: string;
  includeContent?: boolean;
  contentLimit?: number;
}

export interface ActorProfileResponse {
  success: boolean;
  data: {
    actor: Actor;
    content?: Content[];
    filmographyCount: number;
  };
  error?: string;
  metadata: {
    source: 'imdb' | 'cache' | 'database';
    timestamp: string;
    cached: boolean;
    responseTime: number;
  };
}

export interface ContentRequest {
  contentId: string;
  includeActors?: boolean;
  actorLimit?: number;
}

export interface ContentResponse {
  success: boolean;
  data: {
    content: Content;
    actors?: Actor[];
    actorCount: number;
  };
  error?: string;
  metadata: {
    source: 'imdb' | 'cache' | 'database';
    timestamp: string;
    cached: boolean;
    responseTime: number;
  };
}

// Revolutionary fast retrieval interface
export interface IMDBDataService {
  // Actor operations
  searchActors(query: string, options?: ActorSearchRequest): Promise<Actor[]>;
  getActorProfile(actorId: string, options?: ActorProfileRequest): Promise<Actor>;
  getActorByIMDBId(imdbId: string): Promise<Actor | null>;

  // Content operations
  getContentMetadata(contentId: string, options?: ContentRequest): Promise<Content>;
  getContentByIMDBId(imdbId: string): Promise<Content | null>;
  searchContent(query: string, limit?: number): Promise<Content[]>;

  // Bulk operations
  syncActorData(actorIds?: string[]): Promise<IMDBSyncLog>;
  syncContentData(contentIds?: string[]): Promise<IMDBSyncLog>;
  fullSync(): Promise<IMDBSyncLog>;

  // Cache operations
  clearCache(pattern?: string): Promise<number>;
  warmCache(queries: string[]): Promise<void>;
  getCacheStats(): Promise<{ hitRate: number; totalEntries: number; size: number }>;
}

// Caching interface
export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(pattern?: string): Promise<number>;
  exists(key: string): Promise<boolean>;
  getStats(): Promise<CacheStats>;
}

export interface CacheStats {
  hitRate: number;
  missRate: number;
  totalEntries: number;
  memoryUsage: number;
  oldestEntry: Date;
  newestEntry: Date;
}

// Performance monitoring interface
export interface PerformanceMonitor {
  recordResponseTime(
    endpoint: string,
    responseTime: number,
    metadata?: Record<string, any>,
  ): Promise<void>;
  recordCacheHit(key: string): Promise<void>;
  recordCacheMiss(key: string): Promise<void>;
  recordDBQuery(query: string, duration: number, metadata?: Record<string, any>): Promise<void>;
  getMetrics(metricType?: string, timeWindow?: number): Promise<PerformanceMetric[]>;
  getSummary(
    metricType: string,
    timeWindow?: number,
  ): Promise<{
    avg: number;
    min: number;
    max: number;
    count: number;
  }>;
}

// Error types
export class IMDBError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, any>,
  ) {
    super(message);
    this.name = 'IMDBError';
  }
}

export class CacheError extends IMDBError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'CACHE_ERROR', 503, details);
    this.name = 'CacheError';
  }
}

export class ValidationError extends IMDBError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class ExternalAPIError extends IMDBError {
  constructor(
    message: string,
    public apiName: string,
    details?: Record<string, any>,
  ) {
    super(message, 'EXTERNAL_API_ERROR', 502, details);
    this.name = 'ExternalAPIError';
  }
}

// Configuration interfaces
export interface IMDBConfig {
  cache: {
    ttlSeconds: number;
    maxSize: number;
    cleanupIntervalSeconds: number;
  };
  performance: {
    responseTimeThresholdMs: number;
    enableMetrics: boolean;
    metricsRetentionDays: number;
  };
  sync: {
    autoSyncEnabled: boolean;
    syncIntervalHours: number;
    batchSize: number;
    retryAttempts: number;
  };
  api: {
    rateLimitPerSecond: number;
    timeoutMs: number;
    retryDelayMs: number;
  };
}
