-- Goal views table for materialized projections
-- Namespace: work/goals

CREATE TABLE IF NOT EXISTS goal_views (
  goalId TEXT PRIMARY KEY,
  objective TEXT NOT NULL,
  successCriteria TEXT NOT NULL, -- JSON array
  scopeIn TEXT NOT NULL,          -- JSON array
  scopeOut TEXT NOT NULL,         -- JSON array
  boundaries TEXT NOT NULL,       -- JSON array
  status TEXT NOT NULL,
  note TEXT,                      -- Optional note for status changes
  version INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_goal_status ON goal_views(status);
CREATE INDEX IF NOT EXISTS idx_goal_created ON goal_views(createdAt);
