-- Component views table for materialized projections
-- Namespace: solution/components

CREATE TABLE IF NOT EXISTS component_views (
  componentId TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  responsibility TEXT NOT NULL,
  path TEXT NOT NULL,
  status TEXT NOT NULL,
  deprecationReason TEXT,
  version INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_component_name ON component_views(name);
CREATE INDEX IF NOT EXISTS idx_component_type ON component_views(type);
CREATE INDEX IF NOT EXISTS idx_component_status ON component_views(status);
