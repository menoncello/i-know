// Core domain types for I Know platform

export interface Actor {
  id: string;
  name: string;
  imdbId?: string;
  imageUrl?: string;
  biography?: string;
  knownFor?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Content {
  id: string;
  type: 'movie' | 'tv' | 'documentary';
  title: string;
  year?: number;
  imdbId?: string;
  posterUrl?: string;
  synopsis?: string;
  actors: Actor[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ActorDetection {
  id: string;
  contentId: string;
  actorId: string;
  confidence: number;
  timestamp: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface User {
  id: string;
  email: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  favoriteActors: string[];
  watchlist: string[];
  notifications: boolean;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SearchResult {
  id: string;
  type: 'actor' | 'content';
  title: string;
  subtitle?: string;
  imageUrl?: string;
  relevanceScore: number;
}
