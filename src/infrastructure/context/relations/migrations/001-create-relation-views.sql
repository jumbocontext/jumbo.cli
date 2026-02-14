-- Relation views table for materialized projections
-- Namespace: relations

CREATE TABLE IF NOT EXISTS relation_views (
  relationId TEXT PRIMARY KEY,
  fromEntityType TEXT NOT NULL,
  fromEntityId TEXT NOT NULL,
  toEntityType TEXT NOT NULL,
  toEntityId TEXT NOT NULL,
  relationType TEXT NOT NULL,
  strength TEXT,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  version INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Indexes for efficient graph traversal
CREATE INDEX IF NOT EXISTS idx_relation_from ON relation_views(fromEntityType, fromEntityId);
CREATE INDEX IF NOT EXISTS idx_relation_to ON relation_views(toEntityType, toEntityId);
CREATE INDEX IF NOT EXISTS idx_relation_type ON relation_views(relationType);
CREATE INDEX IF NOT EXISTS idx_relation_status ON relation_views(status);

-- Composite index for finding specific relations
CREATE UNIQUE INDEX IF NOT EXISTS idx_relation_unique ON relation_views(
  fromEntityType, fromEntityId, toEntityType, toEntityId, relationType
);
