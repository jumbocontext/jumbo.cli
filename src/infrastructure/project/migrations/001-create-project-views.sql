-- Project views table for materialized projections
-- Namespace: project-knowledge/project

CREATE TABLE IF NOT EXISTS project_views (
  projectId TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  purpose TEXT,
  boundaries TEXT NOT NULL,       -- JSON array
  version INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
