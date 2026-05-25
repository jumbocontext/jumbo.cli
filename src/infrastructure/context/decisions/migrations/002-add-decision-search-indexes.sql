-- Search-supporting indexes for decision search filters and ordering
-- Namespace: solution/decisions

CREATE INDEX IF NOT EXISTS idx_decision_title ON decision_views(title);
CREATE INDEX IF NOT EXISTS idx_decision_status_created ON decision_views(status, createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_decision_context ON decision_views(context);
CREATE INDEX IF NOT EXISTS idx_decision_rationale ON decision_views(rationale);
CREATE INDEX IF NOT EXISTS idx_decision_alternatives ON decision_views(alternatives);
CREATE INDEX IF NOT EXISTS idx_decision_consequences ON decision_views(consequences);
CREATE INDEX IF NOT EXISTS idx_decision_reversal_reason ON decision_views(reversalReason);
CREATE INDEX IF NOT EXISTS idx_decision_superseded_by ON decision_views(supersededBy);
