-- Audience views table for materialized projections
-- Namespace: project-knowledge/audiences

CREATE TABLE IF NOT EXISTS audience_views (
  audienceId TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT,
  isRemoved INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audience_name ON audience_views(name);
CREATE INDEX IF NOT EXISTS idx_audience_removed ON audience_views(isRemoved);
