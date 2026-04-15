-- Add deprecated column to architecture_views
-- Namespace: solution/architecture

ALTER TABLE architecture_views ADD COLUMN deprecated INTEGER NOT NULL DEFAULT 0;
