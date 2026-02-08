import {
  EmbeddedInvariant,
  EmbeddedGuideline,
  EmbeddedDependency,
  EmbeddedComponent,
  EmbeddedArchitecture,
} from "../../../domain/goals/EmbeddedContextTypes.js";

/**
 * Command to define a new goal.
 * Represents the user's intent to create a goal aggregate.
 *
 * Note: goalId is NOT included - the handler owns ID generation
 * as part of orchestration (Clean Architecture principle).
 */
export interface AddGoalCommand {
  readonly objective: string;
  readonly successCriteria: string[];
  readonly scopeIn?: string[];
  readonly scopeOut?: string[];
  readonly boundaries?: string[];
  // Embedded context fields (optional - populated with --interactive)
  readonly relevantInvariants?: EmbeddedInvariant[];
  readonly relevantGuidelines?: EmbeddedGuideline[];
  readonly relevantDependencies?: EmbeddedDependency[];
  readonly relevantComponents?: EmbeddedComponent[];
  readonly architecture?: EmbeddedArchitecture;
  readonly filesToBeCreated?: string[];
  readonly filesToBeChanged?: string[];
  // Goal chaining fields
  readonly nextGoalId?: string;      // Sets NextGoal on this new goal
  readonly previousGoalId?: string;  // Updates the referenced goal's NextGoal to point to this new goal
}
