-- Session views table for materialized projections
-- Namespace: work/sessions

CREATE TABLE IF NOT EXISTS session_views (
  sessionId TEXT PRIMARY KEY,
  focus TEXT,  -- Nullable - set at session end, not start
  status TEXT NOT NULL CHECK(status IN ('active', 'paused', 'blocked', 'ended')),
  contextSnapshot TEXT,
  version INTEGER NOT NULL,
  startedAt TEXT NOT NULL,
  endedAt TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_session_status ON session_views(status);
CREATE INDEX IF NOT EXISTS idx_session_created ON session_views(createdAt DESC);

-- Session Summary views table for context delivery optimization
-- Uses 'LATEST' as static ID for O(1) point-read lookup
-- Historical sessions stored with their original UUIDs

CREATE TABLE IF NOT EXISTS session_summary_views (
  session_id TEXT PRIMARY KEY,           -- 'LATEST' or original UUID
  original_session_id TEXT NOT NULL,     -- Always the original UUID
  focus TEXT,                             -- Nullable - set at session end, not start
  status TEXT NOT NULL CHECK(status IN ('active', 'paused', 'ended')),
  context_snapshot TEXT,
  completed_work TEXT NOT NULL DEFAULT '[]',      -- JSON array of GoalReference
  blockers_encountered TEXT NOT NULL DEFAULT '[]', -- JSON array of BlockerReference
  decisions TEXT NOT NULL DEFAULT '[]',            -- JSON array of DecisionReference
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Index for historical queries by original session ID
CREATE INDEX IF NOT EXISTS idx_session_summary_original_id
  ON session_summary_views(original_session_id);

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_session_summary_status
  ON session_summary_views(status);
