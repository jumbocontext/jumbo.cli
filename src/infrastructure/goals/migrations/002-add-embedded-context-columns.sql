-- Add embedded context columns to goal_views table
-- Namespace: work/goals

-- Embedded context fields (all stored as JSON, nullable for backward compatibility)
ALTER TABLE goal_views ADD COLUMN relevantInvariants TEXT;   -- JSON array of EmbeddedInvariant
ALTER TABLE goal_views ADD COLUMN relevantGuidelines TEXT;   -- JSON array of EmbeddedGuideline
ALTER TABLE goal_views ADD COLUMN relevantDependencies TEXT; -- JSON array of EmbeddedDependency
ALTER TABLE goal_views ADD COLUMN relevantComponents TEXT;   -- JSON array of EmbeddedComponent
ALTER TABLE goal_views ADD COLUMN architecture TEXT;         -- JSON object of EmbeddedArchitecture
ALTER TABLE goal_views ADD COLUMN filesToBeCreated TEXT;     -- JSON array of strings
ALTER TABLE goal_views ADD COLUMN filesToBeChanged TEXT;     -- JSON array of strings
