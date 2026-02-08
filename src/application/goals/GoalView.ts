import {
  EmbeddedInvariant,
  EmbeddedGuideline,
  EmbeddedDependency,
  EmbeddedComponent,
  EmbeddedArchitecture,
} from "../../domain/goals/EmbeddedContextTypes.js";

/**
 * Read model for Goal aggregate.
 * Represents the materialized view stored in SQLite.
 */
export interface GoalView {
  readonly goalId: string;
  readonly objective: string;
  readonly successCriteria: string[];
  readonly scopeIn: string[];
  readonly scopeOut: string[];
  readonly boundaries: string[];
  readonly status: string;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly note?: string;  // Optional: populated when blocked or completed
  readonly progress: string[];  // Tracks completed sub-tasks (append-only)
  // Claim fields - populated when goal is started/resumed, cleared on complete/reset
  readonly claimedBy?: string;      // WorkerId of the claiming worker
  readonly claimedAt?: string;      // ISO 8601 timestamp when claim was created
  readonly claimExpiresAt?: string; // ISO 8601 timestamp when claim expires
  // Embedded context fields - populated during goal creation with --interactive
  readonly relevantInvariants?: EmbeddedInvariant[];
  readonly relevantGuidelines?: EmbeddedGuideline[];
  readonly relevantDependencies?: EmbeddedDependency[];
  readonly relevantComponents?: EmbeddedComponent[];
  readonly architecture?: EmbeddedArchitecture;
  readonly filesToBeCreated?: string[];
  readonly filesToBeChanged?: string[];
  readonly nextGoalId?: string;
}
