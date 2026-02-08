-- Architecture views table for materialized projections
-- Namespace: solution/architecture

CREATE TABLE IF NOT EXISTS architecture_views (
  architectureId TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  organization TEXT NOT NULL,
  patterns TEXT NOT NULL,        -- JSON array
  principles TEXT NOT NULL,       -- JSON array
  dataFlow TEXT,
  dataStores TEXT NOT NULL,       -- JSON array of objects
  stack TEXT NOT NULL,            -- JSON array
  version INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
