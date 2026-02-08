-- Dependency views table for materialized projections
-- Namespace: solution/dependencies

CREATE TABLE IF NOT EXISTS dependency_views (
  dependencyId TEXT PRIMARY KEY,
  consumerId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  endpoint TEXT,
  contract TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  removedAt TEXT,
  removalReason TEXT,
  version INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_dependency_consumer ON dependency_views(consumerId);
CREATE INDEX IF NOT EXISTS idx_dependency_provider ON dependency_views(providerId);
CREATE INDEX IF NOT EXISTS idx_dependency_status ON dependency_views(status);
