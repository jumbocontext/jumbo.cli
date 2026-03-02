-- Add external dependency identity columns while preserving legacy consumer/provider columns
-- Namespace: solution/dependencies

ALTER TABLE dependency_views ADD COLUMN name TEXT;
ALTER TABLE dependency_views ADD COLUMN ecosystem TEXT;
ALTER TABLE dependency_views ADD COLUMN packageName TEXT;
ALTER TABLE dependency_views ADD COLUMN versionConstraint TEXT;

CREATE INDEX IF NOT EXISTS idx_dependency_name ON dependency_views(name);
CREATE INDEX IF NOT EXISTS idx_dependency_ecosystem ON dependency_views(ecosystem);
CREATE INDEX IF NOT EXISTS idx_dependency_package_name ON dependency_views(packageName);
