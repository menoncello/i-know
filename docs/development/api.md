# API Documentation

This document describes the RESTful API for the I Know platform.

## 🌐 Base URL

- **Development**: `http://localhost:3001`
- **Staging**: `https://staging-api.iknow.com`
- **Production**: `https://api.iknow.com`

## 🔐 Authentication

Currently, the API does not require authentication. This will be implemented in a future story.

## 📊 Response Format

All API responses follow a consistent format:

```ts
interface APIResponse<T> {
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
```

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Tom Hanks",
    "imdbId": "nm0000158"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Actor not found"
}
```

## 🎭 Actors API

### Get All Actors

Retrieve a paginated list of actors.

```http
GET /api/v1/actors
```

**Query Parameters:**

| Parameter | Type   | Default | Description              |
| --------- | ------ | ------- | ------------------------ |
| `page`    | number | 1       | Page number              |
| `limit`   | number | 20      | Items per page (max 100) |
| `search`  | string | -       | Search by actor name     |

**Example:**

```http
GET /api/v1/actors?page=1&limit=10&search=Tom
```

**Response:**

```json
{
  "success": true,
  "data": {
    "actors": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Tom Hanks",
        "imdbId": "nm0000158",
        "imageUrl": "https://example.com/tom-hanks.jpg",
        "biography": "Thomas Jeffrey Hanks...",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### Get Actor by ID

Retrieve a specific actor by their ID.

```http
GET /api/v1/actors/{id}
```

**Path Parameters:**

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `id`      | string | Actor UUID  |

**Example:**

```http
GET /api/v1/actors/123e4567-e89b-12d3-a456-426614174000
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Tom Hanks",
    "imdbId": "nm0000158",
    "imageUrl": "https://example.com/tom-hanks.jpg",
    "biography": "Thomas Jeffrey Hanks...",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### Create Actor

Create a new actor.

```http
POST /api/v1/actors
```

**Request Body:**

```json
{
  "name": "Actor Name",
  "imdbId": "nm0000000",
  "imageUrl": "https://example.com/image.jpg",
  "biography": "Actor biography..."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "new-actor-uuid",
    "name": "Actor Name",
    "imdbId": "nm0000000",
    "imageUrl": "https://example.com/image.jpg",
    "biography": "Actor biography...",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### Update Actor

Update an existing actor.

```http
PUT /api/v1/actors/{id}
```

**Path Parameters:**

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `id`      | string | Actor UUID  |

**Request Body:**

```json
{
  "name": "Updated Actor Name",
  "imdbId": "nm0000001",
  "imageUrl": "https://example.com/new-image.jpg",
  "biography": "Updated biography..."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "actor-uuid",
    "name": "Updated Actor Name",
    "imdbId": "nm0000001",
    "imageUrl": "https://example.com/new-image.jpg",
    "biography": "Updated biography...",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T01:00:00.000Z"
  }
}
```

### Delete Actor

Delete an actor.

```http
DELETE /api/v1/actors/{id}
```

**Path Parameters:**

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `id`      | string | Actor UUID  |

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Actor deleted successfully"
  }
}
```

## 🎬 Content API

### Get All Content

Retrieve a paginated list of content (movies, TV shows, documentaries).

```http
GET /api/v1/content
```

**Query Parameters:**

| Parameter | Type   | Default | Description                             |
| --------- | ------ | ------- | --------------------------------------- |
| `page`    | number | 1       | Page number                             |
| `limit`   | number | 20      | Items per page                          |
| `type`    | string | -       | Filter by type (movie, tv, documentary) |
| `search`  | string | -       | Search by title                         |

**Example:**

```http
GET /api/v1/content?type=movie&search=Forrest
```

**Response:**

```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "content-uuid",
        "type": "movie",
        "title": "Forrest Gump",
        "year": 1994,
        "imdbId": "tt0109830",
        "posterUrl": "https://example.com/forrest-gump.jpg",
        "synopsis": "The presidencies of Kennedy and Johnson...",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### Get Content by ID

Retrieve specific content by ID.

```http
GET /api/v1/content/{id}
```

**Path Parameters:**

| Parameter | Type   | Description  |
| --------- | ------ | ------------ |
| `id`      | string | Content UUID |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "content-uuid",
    "type": "movie",
    "title": "Forrest Gump",
    "year": 1994,
    "imdbId": "tt0109830",
    "posterUrl": "https://example.com/forrest-gump.jpg",
    "synopsis": "The presidencies of Kennedy and Johnson...",
    "actors": [
      {
        "id": "actor-uuid",
        "name": "Tom Hanks",
        "imdbId": "nm0000158"
      }
    ],
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

## 🔍 Search API

### Global Search

Search across actors and content.

```http
GET /api/v1/search
```

**Query Parameters:**

| Parameter | Type   | Required | Description                     |
| --------- | ------ | -------- | ------------------------------- |
| `q`       | string | Yes      | Search query                    |
| `type`    | string | No       | Filter by type (actor, content) |
| `page`    | number | No       | Page number (default: 1)        |
| `limit`   | number | No       | Items per page (default: 20)    |

**Example:**

```http
GET /api/v1/search?q=Tom Hanks&type=actor
```

**Response:**

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "actor-uuid",
        "type": "actor",
        "title": "Tom Hanks",
        "subtitle": "Actor",
        "imageUrl": "https://example.com/tom-hanks.jpg",
        "relevanceScore": 0.95
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

## 🏥 Health Check

### Service Health

Check the health of the API service.

```http
GET /health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "service": "i-know-api",
  "version": "1.0.0"
}
```

## ❌ Error Handling

### HTTP Status Codes

| Status Code | Description           |
| ----------- | --------------------- |
| `200`       | Success               |
| `201`       | Created               |
| `400`       | Bad Request           |
| `404`       | Not Found             |
| `500`       | Internal Server Error |

### Error Response Format

```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE",
  "details": {
    "field": "validation error details"
  }
}
```

### Common Error Codes

| Error Code         | Description               |
| ------------------ | ------------------------- |
| `NOT_FOUND`        | Resource not found        |
| `VALIDATION_ERROR` | Request validation failed |
| `DATABASE_ERROR`   | Database operation failed |
| `INTERNAL_ERROR`   | Internal server error     |

## 📝 Rate Limiting

Currently, no rate limiting is implemented. This will be added in a future iteration.

## 🔄 Versioning

The API is versioned using URL path versioning:

- Current version: `/api/v1/`
- Future versions: `/api/v2/`, `/api/v3/`

## 📚 SDK Examples

### JavaScript/Bun

```ts
// Using Bun's built-in fetch
const response = await fetch('http://localhost:3001/api/v1/actors');
const data = await response.json();

if (data.success) {
  console.log('Actors:', data.data.actors);
}
```

### curl

```bash
# Get all actors
curl http://localhost:3001/api/v1/actors

# Search for actors
curl "http://localhost:3001/api/v1/actors?search=Tom"

# Create actor
curl -X POST http://localhost:3001/api/v1/actors \
  -H "Content-Type: application/json" \
  -d '{"name": "New Actor", "imdbId": "nm1234567"}'
```

## 🧪 Testing API Endpoints

Use the included test server for development:

```bash
# Start API server
bun run dev:api

# Test with curl in another terminal
curl http://localhost:3001/health
curl http://localhost:3001/api/v1/actors
```

Or use the automated integration tests:

```bash
bun test tests/integration/api.test.ts
```
