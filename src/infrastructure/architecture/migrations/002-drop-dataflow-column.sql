-- Drop dataFlow column from architecture_views table
-- This column is no longer needed after dataFlow property removal

ALTER TABLE architecture_views DROP COLUMN dataFlow;
