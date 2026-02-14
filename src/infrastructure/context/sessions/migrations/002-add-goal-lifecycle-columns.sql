-- Add goal lifecycle tracking columns to session_summary_views table
-- Namespace: work/sessions

-- Goal lifecycle event tracking (stored as JSON arrays)
ALTER TABLE session_summary_views ADD COLUMN goals_started TEXT NOT NULL DEFAULT '[]';   -- JSON array of GoalReference
ALTER TABLE session_summary_views ADD COLUMN goals_paused TEXT NOT NULL DEFAULT '[]';    -- JSON array of GoalReference
ALTER TABLE session_summary_views ADD COLUMN goals_resumed TEXT NOT NULL DEFAULT '[]';   -- JSON array of GoalReference
