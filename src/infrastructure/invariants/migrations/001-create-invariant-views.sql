-- Invariant views table for materialized projections
-- Namespace: solution/invariants

CREATE TABLE IF NOT EXISTS invariant_views (
  invariantId TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  rationale TEXT,
  enforcement TEXT NOT NULL,
  version INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_invariant_title ON invariant_views(title);
