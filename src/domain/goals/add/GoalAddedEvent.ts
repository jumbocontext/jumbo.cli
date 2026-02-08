import { BaseEvent, UUID } from "../../BaseEvent.js";
import { GoalEventType, GoalStatusType } from "../Constants.js";
import {
  EmbeddedInvariant,
  EmbeddedGuideline,
  EmbeddedDependency,
  EmbeddedComponent,
  EmbeddedArchitecture,
} from "../EmbeddedContextTypes.js";

/**
 * Emitted when a new goal is defined.
 * This is the first event in the Goal aggregate's lifecycle.
 * Goal starts in 'to-do' status.
 */
export interface GoalAddedEvent extends BaseEvent {
  readonly type: typeof GoalEventType.ADDED;
  readonly payload: {
    readonly objective: string;
    readonly successCriteria: string[];
    readonly scopeIn: string[];
    readonly scopeOut: string[];
    readonly boundaries: string[];
    readonly status: GoalStatusType;
    // Embedded context fields (optional - populated with --interactive)
    readonly relevantInvariants?: EmbeddedInvariant[];
    readonly relevantGuidelines?: EmbeddedGuideline[];
    readonly relevantDependencies?: EmbeddedDependency[];
    readonly relevantComponents?: EmbeddedComponent[];
    readonly architecture?: EmbeddedArchitecture;
    readonly filesToBeCreated?: string[];
    readonly filesToBeChanged?: string[];
    readonly nextGoalId?: UUID;
  };
}
