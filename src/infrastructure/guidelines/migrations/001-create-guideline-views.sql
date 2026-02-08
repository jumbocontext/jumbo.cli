-- Guideline views table for materialized projections
-- Namespace: solution/guidelines

CREATE TABLE IF NOT EXISTS guideline_views (
  guidelineId TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  rationale TEXT NOT NULL,
  enforcement TEXT NOT NULL,
  examples TEXT NOT NULL,         -- JSON array
  isRemoved INTEGER NOT NULL DEFAULT 0,
  removedAt TEXT,
  removalReason TEXT,
  version INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_guideline_category ON guideline_views(category);
CREATE INDEX IF NOT EXISTS idx_guideline_removed ON guideline_views(isRemoved);
