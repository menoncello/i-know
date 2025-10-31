-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom UUID v7 generator function
CREATE OR REPLACE FUNCTION uuid_v7()
RETURNS UUID AS $$
DECLARE
  timestamp_ms BIGINT;
  random_bytes BYTEA;
  uuid_bytes BYTEA;
BEGIN
  -- Get current timestamp in milliseconds since Unix epoch
  timestamp_ms := EXTRACT(EPOCH FROM NOW()) * 1000;

  -- Generate 10 random bytes
  random_bytes := gen_random_bytes(10);

  -- Construct UUID v7 bytes:
  -- 48 bits: timestamp (milliseconds)
  -- 12 bits: random (high)
  -- 62 bits: random (low)
  uuid_bytes :=
    SET_BYTE(bytea '\0\0\0\0\0\0', 0, (timestamp_ms >> 40)::INTEGER) ||
    SET_BYTE(bytea '\0\0\0\0\0\0', 1, (timestamp_ms >> 32)::INTEGER) ||
    SET_BYTE(bytea '\0\0\0\0\0\0', 2, (timestamp_ms >> 24)::INTEGER) ||
    SET_BYTE(bytea '\0\0\0\0\0\0', 3, (timestamp_ms >> 16)::INTEGER) ||
    SET_BYTE(bytea '\0\0\0\0\0\0', 4, (timestamp_ms >> 8)::INTEGER) ||
    SET_BYTE(bytea '\0\0\0\0\0\0', 5, timestamp_ms::INTEGER) ||
    SUBSTRING(random_bytes, 1, 4) ||
    SUBSTRING(random_bytes, 5, 6);

  -- Set version bits (0111 for UUID v7)
  uuid_bytes := SET_BYTE(uuid_bytes, 6, (GET_BYTE(uuid_bytes, 6) & 0x0F) | 0x70);

  -- Set variant bits (10xx for RFC 4122)
  uuid_bytes := SET_BYTE(uuid_bytes, 8, (GET_BYTE(uuid_bytes, 8) & 0x3F) | 0x80);

  RETURN encode(uuid_bytes, 'hex')::UUID;
END;
$$ LANGUAGE plpgsql;

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_v7(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences table with JSONB for flexible settings
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_v7(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Actors table (foundation for future stories)
CREATE TABLE actors (
  id UUID PRIMARY KEY DEFAULT uuid_v7(),
  name VARCHAR(255) NOT NULL,
  bio TEXT,
  birth_date DATE,
  photo_url TEXT,
  imdb_id VARCHAR(50) UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Filmography table (for actor-film relationships)
CREATE TABLE filmography (
  id UUID PRIMARY KEY DEFAULT uuid_v7(),
  actor_id UUID NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  year INTEGER,
  role VARCHAR(255),
  media_type VARCHAR(50) DEFAULT 'movie',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_actors_name ON actors(name);
CREATE INDEX idx_actors_imdb_id ON actors(imdb_id);
CREATE INDEX idx_filmography_actor_id ON filmography(actor_id);
CREATE INDEX idx_filmography_title ON filmography(title);

-- Update timestamps function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_actors_updated_at
  BEFORE UPDATE ON actors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();