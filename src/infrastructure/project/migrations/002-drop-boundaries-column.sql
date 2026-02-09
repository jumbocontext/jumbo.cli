-- Drop boundaries column from project_views table
-- This column is no longer needed after boundaries property removal

ALTER TABLE project_views DROP COLUMN boundaries;
