-- Search-supporting indexes for invariant search filters
-- Namespace: solution/invariants

CREATE INDEX IF NOT EXISTS idx_invariant_search_title ON invariant_views(title);
CREATE INDEX IF NOT EXISTS idx_invariant_search_description ON invariant_views(description);
CREATE INDEX IF NOT EXISTS idx_invariant_search_rationale ON invariant_views(rationale);
