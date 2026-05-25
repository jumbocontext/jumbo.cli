-- Search-supporting indexes for guideline discovery.
-- Namespace: solution/guidelines

CREATE INDEX IF NOT EXISTS idx_guideline_search_removed_category_title
  ON guideline_views(isRemoved, category, title);

CREATE INDEX IF NOT EXISTS idx_guideline_title
  ON guideline_views(title);

CREATE INDEX IF NOT EXISTS idx_guideline_description
  ON guideline_views(description);

CREATE INDEX IF NOT EXISTS idx_guideline_rationale
  ON guideline_views(rationale);

CREATE INDEX IF NOT EXISTS idx_guideline_examples
  ON guideline_views(examples);
