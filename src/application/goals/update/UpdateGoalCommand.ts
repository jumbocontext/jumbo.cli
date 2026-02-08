import {
  EmbeddedInvariant,
  EmbeddedGuideline,
  EmbeddedDependency,
  EmbeddedComponent,
  EmbeddedArchitecture,
} from "../../../domain/goals/EmbeddedContextTypes.js";

/**
 * Command to update an existing goal's properties.
 * Only provided fields will be updated; omitted fields remain unchanged.
 */
export interface UpdateGoalCommand {
  readonly goalId: string;
  readonly objective?: string;
  readonly successCriteria?: string[];
  readonly scopeIn?: string[];
  readonly scopeOut?: string[];
  readonly boundaries?: string[];
  // Embedded context fields (optional - partial update support)
  readonly relevantInvariants?: EmbeddedInvariant[];
  readonly relevantGuidelines?: EmbeddedGuideline[];
  readonly relevantDependencies?: EmbeddedDependency[];
  readonly relevantComponents?: EmbeddedComponent[];
  readonly architecture?: EmbeddedArchitecture;
  readonly filesToBeCreated?: string[];
  readonly filesToBeChanged?: string[];
  readonly nextGoalId?: string;
}
