/**
 * Centralized migrations configuration for all namespaces.
 *
 * This module provides a factory function to generate migration paths
 * relative to the infrastructure directory. Used by both bootstrap.ts
 * (for existing projects) and SqliteConnectionManager (for new databases).
 */

import path from "path";

/**
 * Configuration for namespace-based migrations.
 * Each entry specifies a namespace and the path to its migration files.
 */
export interface NamespaceMigration {
  namespace: string;
  path: string;
}

/**
 * Returns all namespace migrations with paths resolved relative to
 * the provided infrastructure directory.
 */
export function getNamespaceMigrations(infrastructureDir: string): NamespaceMigration[] {
  return [
    // Work category
    // Work category
    { namespace: "sessions", path: path.join(infrastructureDir, "context/sessions/migrations") },
    { namespace: "goals", path: path.join(infrastructureDir, "context/goals/migrations") },
    // Solution category
    { namespace: "decisions", path: path.join(infrastructureDir, "context/decisions/migrations") },
    { namespace: "architecture", path: path.join(infrastructureDir, "context/architecture/migrations") },
    { namespace: "components", path: path.join(infrastructureDir, "context/components/migrations") },
    { namespace: "dependencies", path: path.join(infrastructureDir, "context/dependencies/migrations") },
    { namespace: "guidelines", path: path.join(infrastructureDir, "context/guidelines/migrations") },
    { namespace: "invariants", path: path.join(infrastructureDir, "context/invariants/migrations") },
    // Project knowledge category
    { namespace: "project", path: path.join(infrastructureDir, "context/project/migrations") },
    { namespace: "audiences", path: path.join(infrastructureDir, "context/audiences/migrations") },
    { namespace: "audience-pains", path: path.join(infrastructureDir, "context/audience-pains/migrations") },
    { namespace: "value-propositions", path: path.join(infrastructureDir, "context/value-propositions/migrations") },
    // Relations category
    { namespace: "relations", path: path.join(infrastructureDir, "context/relations/migrations") },
    // Host category
    { namespace: "workers", path: path.join(infrastructureDir, "host/workers/migrations") },
  ];
}
