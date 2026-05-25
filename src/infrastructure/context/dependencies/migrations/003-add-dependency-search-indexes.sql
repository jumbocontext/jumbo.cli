-- Add indexes used by dependency search filters
-- Namespace: solution/dependencies

CREATE INDEX IF NOT EXISTS idx_dependency_search_name ON dependency_views(name);
CREATE INDEX IF NOT EXISTS idx_dependency_search_ecosystem ON dependency_views(ecosystem);
CREATE INDEX IF NOT EXISTS idx_dependency_search_package_name ON dependency_views(packageName);
CREATE INDEX IF NOT EXISTS idx_dependency_search_version_constraint ON dependency_views(versionConstraint);
CREATE INDEX IF NOT EXISTS idx_dependency_search_status ON dependency_views(status);
CREATE INDEX IF NOT EXISTS idx_dependency_search_consumer ON dependency_views(consumerId);
CREATE INDEX IF NOT EXISTS idx_dependency_search_provider ON dependency_views(providerId);
CREATE INDEX IF NOT EXISTS idx_dependency_search_contract ON dependency_views(contract);
CREATE INDEX IF NOT EXISTS idx_dependency_search_endpoint ON dependency_views(endpoint);
