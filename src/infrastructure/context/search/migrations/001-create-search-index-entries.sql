-- Global search index projected from memory entity events.
-- Namespace: context/search

CREATE TABLE IF NOT EXISTS search_index_entries (
  sourceType TEXT NOT NULL,
  sourceId TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  facets TEXT NOT NULL,
  metadata TEXT NOT NULL,
  version INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  PRIMARY KEY (sourceType, sourceId)
);

CREATE INDEX IF NOT EXISTS idx_search_index_category
  ON search_index_entries(category);

CREATE INDEX IF NOT EXISTS idx_search_index_updated
  ON search_index_entries(updatedAt DESC);

CREATE INDEX IF NOT EXISTS idx_search_index_title
  ON search_index_entries(title);
