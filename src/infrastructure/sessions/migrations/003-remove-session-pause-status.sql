-- Clean up sessions with paused status after removing session pause/resume feature
-- Namespace: work/sessions

-- Update any paused sessions to active status
-- This is safe because session pause/resume feature has been removed
UPDATE session_summary_views
SET status = 'active'
WHERE status = 'paused';
