-- ═══════════════════════════════════════════════════════
-- Guandalini blog — initial schema
-- ═══════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Admin user (single row enforced by seed.ts) ─────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(120) NOT NULL,
  role          VARCHAR(120) NOT NULL DEFAULT 'Editor-chefe',
  avatar_url    VARCHAR(500),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Authors (fictitious writers) ─────────────────────
CREATE TABLE IF NOT EXISTS authors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(120) NOT NULL,
  role        VARCHAR(120) NOT NULL,
  avatar_url  VARCHAR(500) NOT NULL,
  avatar_type VARCHAR(20)  NOT NULL DEFAULT 'dicebear',  -- 'upload' | 'dicebear'
  avatar_crop JSONB,                                      -- { x, y, scale } for uploaded images
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_authors_created_at ON authors (created_at DESC);

-- ── Categories ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(60) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Badges (article style tags) ──────────────────────
CREATE TABLE IF NOT EXISTS badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(60) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Articles ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS articles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            VARCHAR(200) NOT NULL,
  subtitle         VARCHAR(500),
  category_id      UUID REFERENCES categories (id) ON DELETE SET NULL,
  author_id        UUID REFERENCES authors    (id) ON DELETE SET NULL,
  badge_id         UUID REFERENCES badges     (id) ON DELETE SET NULL,
  reading_time_min INTEGER NOT NULL DEFAULT 5,
  hero_image       VARCHAR(1000),
  hero_caption     VARCHAR(500),
  body             JSONB NOT NULL DEFAULT '[]'::jsonb,
  status           VARCHAR(20) NOT NULL DEFAULT 'published',  -- 'draft' | 'published'
  pin_position     VARCHAR(20),                                -- NULL | 'left' | 'right_top' | 'right_bottom'
  published_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_status       ON articles (status);

-- Only one article can occupy each pin slot at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_pin_unique
  ON articles (pin_position)
  WHERE pin_position IS NOT NULL;

-- ── Trigger to keep updated_at fresh ─────────────────
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_articles_updated_at ON articles;
CREATE TRIGGER trg_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION touch_updated_at();
