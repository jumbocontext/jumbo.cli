-- Workers table for worker identity persistence
-- Namespace: host/workers

CREATE TABLE IF NOT EXISTS workers (
  workerId TEXT PRIMARY KEY,
  hostSessionKey TEXT NOT NULL UNIQUE,
  mode TEXT,
  createdAt TEXT NOT NULL,
  lastSeenAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workers_host_session_key ON workers(hostSessionKey);
