-- Searchable, public dataset metadata and one-to-many downloadable resources.
-- Rollback: 0006_dataset_metadata_catalog.down.sql

CREATE TABLE datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(160) NOT NULL,
  title VARCHAR(255) NOT NULL,
  summary VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  source_organization VARCHAR(255) NOT NULL,
  source_url TEXT,
  source_label bps_source NOT NULL DEFAULT 'SIMULATED',
  license_name VARCHAR(160) NOT NULL,
  license_url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  data_dictionary JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_updated_at TIMESTAMPTZ NOT NULL,
  downloads_count INTEGER NOT NULL DEFAULT 0 CHECK (downloads_count >= 0),
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  search_vector TSVECTOR NOT NULL DEFAULT ''::tsvector,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE FUNCTION update_datasets_search_vector() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.description, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(NEW.source_organization, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.category, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$;

CREATE TRIGGER datasets_search_vector_update
  BEFORE INSERT OR UPDATE OF title, summary, description, source_organization, category, tags
  ON datasets
  FOR EACH ROW
  EXECUTE FUNCTION update_datasets_search_vector();

CREATE UNIQUE INDEX datasets_slug_unique_idx ON datasets (slug);
CREATE INDEX datasets_search_vector_gin_idx ON datasets USING GIN (search_vector);
CREATE INDEX datasets_tags_gin_idx ON datasets USING GIN (tags);
CREATE INDEX datasets_published_updated_idx
  ON datasets (is_published, last_updated_at DESC);
CREATE INDEX datasets_category_idx ON datasets (category);
CREATE INDEX datasets_source_organization_idx ON datasets (source_organization);
CREATE INDEX datasets_downloads_idx ON datasets (downloads_count DESC);

CREATE TABLE dataset_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  format VARCHAR(16) NOT NULL CHECK (format IN ('CSV', 'JSON', 'PDF', 'API')),
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT dataset_resources_dataset_format_url_idx
    UNIQUE (dataset_id, format, url)
);

CREATE INDEX dataset_resources_dataset_id_idx
  ON dataset_resources (dataset_id);
CREATE INDEX dataset_resources_format_idx
  ON dataset_resources (format);
