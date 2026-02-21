-- Add title column to goal_views table
ALTER TABLE goal_views ADD COLUMN title TEXT NOT NULL DEFAULT '';
