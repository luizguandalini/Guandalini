ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS slug VARCHAR(240);

UPDATE articles
SET slug = CONCAT('artigo-', SUBSTRING(id::text, 1, 8))
WHERE slug IS NULL OR BTRIM(slug) = '';

ALTER TABLE articles
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_slug_unique
  ON articles (slug);
