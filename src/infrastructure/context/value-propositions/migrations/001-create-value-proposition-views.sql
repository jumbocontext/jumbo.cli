-- Value proposition views table for materialized projections
-- Namespace: project-knowledge/value-propositions

CREATE TABLE IF NOT EXISTS value_proposition_views (
  valuePropositionId TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  benefit TEXT NOT NULL,
  measurableOutcome TEXT,
  version INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_value_proposition_title
  ON value_proposition_views(title);
CREATE INDEX IF NOT EXISTS idx_value_proposition_created
  ON value_proposition_views(createdAt);
