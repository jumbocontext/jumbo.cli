import { SessionContext, SessionContextView } from "./SessionContext.js";

/**
 * SessionResumeContextEnricher - Adds resume-specific LLM instructions to base context
 *
 * Enriches the event-agnostic SessionContext with work resume orientation
 * instruction signals that guide the presentation layer's LLM instruction rendering.
 *
 * Instruction signals:
 * - "resume-continuation-prompt": Always included. Work was interrupted, continue from where left off
 * - "paused-goals-context": Paused goals exist, check registered progress
 */
export class SessionResumeContextEnricher {
  enrich(context: SessionContext): SessionContextView {
    return {
      ...context,
      instructions: this.buildResumeInstructions(context),
      scope: "work-resume",
    };
  }

  private buildResumeInstructions(context: SessionContext): string[] {
    const instructions: string[] = [];

    instructions.push("resume-continuation-prompt");

    if (context.pausedGoals.length > 0) {
      instructions.push("paused-goals-context");
    }

    return instructions;
  }
}
