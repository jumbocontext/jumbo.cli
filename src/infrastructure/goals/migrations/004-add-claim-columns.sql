-- Add claim columns to goal_views table
-- Namespace: work/goals
-- These columns track which worker has claimed a goal and when the claim expires

ALTER TABLE goal_views ADD COLUMN claimedBy TEXT;       -- WorkerId of the claiming worker
ALTER TABLE goal_views ADD COLUMN claimedAt TEXT;       -- ISO 8601 timestamp when claim was created
ALTER TABLE goal_views ADD COLUMN claimExpiresAt TEXT;  -- ISO 8601 timestamp when claim expires
