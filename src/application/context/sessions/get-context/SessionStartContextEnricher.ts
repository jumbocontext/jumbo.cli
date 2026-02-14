import { SessionContext, SessionContextView } from "./SessionContext.js";

/**
 * SessionStartContextEnricher - Adds start-specific LLM instructions to base context
 *
 * Enriches the event-agnostic SessionContext with session start orientation
 * instruction signals that guide the presentation layer's LLM instruction rendering.
 *
 * Instruction signals:
 * - "brownfield-onboarding": Project has no Jumbo context yet, guide user through setup
 * - "paused-goals-resume": Goals were paused in a previous session, prompt for resume
 * - "goal-selection-prompt": Standard goal selection prompt for session start
 */
export class SessionStartContextEnricher {
  enrich(context: SessionContext): SessionContextView {
    return {
      ...context,
      instructions: this.buildStartInstructions(context),
      scope: "session-start",
    };
  }

  private buildStartInstructions(context: SessionContext): string[] {
    const instructions: string[] = [];

    if (!context.hasSolutionContext) {
      instructions.push("brownfield-onboarding");
    }

    if (
      context.latestSessionSummary?.goalsPaused &&
      context.latestSessionSummary.goalsPaused.length > 0
    ) {
      instructions.push("paused-goals-resume");
    }

    instructions.push("goal-selection-prompt");

    return instructions;
  }
}
