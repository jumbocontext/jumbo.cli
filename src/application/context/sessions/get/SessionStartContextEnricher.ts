import { ContextualSessionView } from "./ContextualSessionView.js";
import { EnrichedSessionContext } from "./EnrichedSessionContext.js";

/**
 * SessionStartContextEnricher - Adds start-specific LLM instructions to base context
 *
 * Enriches the event-agnostic ContextualSessionView with session start orientation
 * instruction signals that guide the presentation layer's LLM instruction rendering.
 *
 * Instruction signals:
 * - "brownfield-onboarding": Project has no Jumbo context yet, guide user through setup
 * - "paused-goals-resume": Goals are currently paused, prompt for resume
 * - "goal-selection-prompt": Standard goal selection prompt for session start
 */
export class SessionStartContextEnricher {
  enrich(view: ContextualSessionView): EnrichedSessionContext {
    return {
      ...view,
      instructions: this.buildStartInstructions(view),
      scope: "session-start",
    };
  }

  private buildStartInstructions(view: ContextualSessionView): string[] {
    const instructions: string[] = [];

    if (!view.context.hasSolutionContext) {
      instructions.push("brownfield-onboarding");
    }

    if (view.context.pausedGoals.length > 0) {
      instructions.push("paused-goals-resume");
    }

    instructions.push("goal-selection-prompt");

    return instructions;
  }
}
