-- Audience pain views table for materialized projections
-- Namespace: project-knowledge/audience-pains

CREATE TABLE IF NOT EXISTS audience_pain_views (
  painId TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  resolvedAt TEXT,
  version INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audience_pain_status ON audience_pain_views(status);
CREATE INDEX IF NOT EXISTS idx_audience_pain_created ON audience_pain_views(createdAt);
