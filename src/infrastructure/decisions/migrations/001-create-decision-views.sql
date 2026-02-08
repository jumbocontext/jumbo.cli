-- Decision views table for materialized projections
-- Namespace: solution/decisions

CREATE TABLE IF NOT EXISTS decision_views (
  decisionId TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  context TEXT NOT NULL,
  rationale TEXT,
  alternatives TEXT,              -- JSON array
  consequences TEXT,
  status TEXT NOT NULL,           -- 'active', 'reversed', 'superseded'
  supersededBy TEXT,              -- FK to another decision
  reversalReason TEXT,
  reversedAt TEXT,                -- Timestamp when decision was reversed
  version INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_decision_status ON decision_views(status);
CREATE INDEX IF NOT EXISTS idx_decision_created ON decision_views(createdAt DESC);
