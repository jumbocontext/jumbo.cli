-- Add progress column to goal_views table for tracking completed sub-tasks
-- Namespace: work/goals

ALTER TABLE goal_views ADD COLUMN progress TEXT;  -- JSON array of strings (task descriptions)
