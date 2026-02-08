-- Add nextGoalId column to goal_views table for goal chaining
-- Namespace: work/goals

ALTER TABLE goal_views ADD COLUMN nextGoalId TEXT;
