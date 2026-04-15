/**
 * Constants for Architecture entity deprecation messaging.
 * Used by CLI commands and output builders to display consistent migration guidance.
 */

export const ARCHITECTURE_MIGRATION_MAPPING = {
  patterns: { target: "Decisions", command: "jumbo decision add" },
  principles: { target: "Invariants", command: "jumbo invariant add" },
  organization: { target: "Invariants", command: "jumbo invariant add" },
  dataStores: { target: "Components", command: "jumbo component add" },
  stack: { target: "Dependencies", command: "jumbo dependency add" },
} as const;

export const ARCHITECTURE_DEPRECATION_NOTICE =
  "Architecture entity is deprecated and will be removed in v3.";

export const ARCHITECTURE_MIGRATION_TABLE = [
  `  patterns      → ${ARCHITECTURE_MIGRATION_MAPPING.patterns.command}`,
  `  principles    → ${ARCHITECTURE_MIGRATION_MAPPING.principles.command}`,
  `  organization  → ${ARCHITECTURE_MIGRATION_MAPPING.organization.command}`,
  `  dataStores    → ${ARCHITECTURE_MIGRATION_MAPPING.dataStores.command}`,
  `  stack         → ${ARCHITECTURE_MIGRATION_MAPPING.stack.command}`,
].join("\n");

export const ARCHITECTURE_REJECTION_MESSAGE = [
  ARCHITECTURE_DEPRECATION_NOTICE,
  "Register individual entities instead:",
  "",
  ARCHITECTURE_MIGRATION_TABLE,
].join("\n");
