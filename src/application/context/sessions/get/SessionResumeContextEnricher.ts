import { ContextualSessionView } from "./ContextualSessionView.js";
import { EnrichedSessionContext } from "./EnrichedSessionContext.js";

/**
 * SessionResumeContextEnricher - Adds resume-specific LLM instructions to base context
 *
 * Enriches the event-agnostic ContextualSessionView with work resume orientation
 * instruction signals that guide the presentation layer's LLM instruction rendering.
 *
 * Instruction signals:
 * - "resume-continuation-prompt": Always included. Work was interrupted, continue from where left off
 * - "paused-goals-context": Paused goals exist, check registered progress
 */
export class SessionResumeContextEnricher {
  enrich(view: ContextualSessionView): EnrichedSessionContext {
    return {
      ...view,
      instructions: this.buildResumeInstructions(view),
      scope: "work-resume",
    };
  }

  private buildResumeInstructions(view: ContextualSessionView): string[] {
    const instructions: string[] = [];

    instructions.push("resume-continuation-prompt");

    if (view.context.pausedGoals.length > 0) {
      instructions.push("paused-goals-context");
    }

    return instructions;
  }
}
