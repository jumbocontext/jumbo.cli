-- Drop boundaries and embedded context columns from goal_views table
-- These fields are no longer part of the Goal read model after domain simplification

ALTER TABLE goal_views DROP COLUMN boundaries;
ALTER TABLE goal_views DROP COLUMN relevantInvariants;
ALTER TABLE goal_views DROP COLUMN relevantGuidelines;
ALTER TABLE goal_views DROP COLUMN relevantDependencies;
ALTER TABLE goal_views DROP COLUMN relevantComponents;
ALTER TABLE goal_views DROP COLUMN architecture;
ALTER TABLE goal_views DROP COLUMN filesToBeCreated;
ALTER TABLE goal_views DROP COLUMN filesToBeChanged;
