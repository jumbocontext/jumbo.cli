import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { EnrichedSessionContext } from "../../../../../application/context/sessions/get/EnrichedSessionContext.js";
import { SessionContextOutputBuilder } from "./SessionContextOutputBuilder.js";
import { SessionGoalsOutputBuilder } from "./SessionGoalsOutputBuilder.js";
/**
 * SessionStartOutputBuilder - Top-level output builder for session start command.
 *
 * Composes SessionContextOutputBuilder and SessionGoalsOutputBuilder to produce
 * the complete session start output. Supports both human-readable and structured modes.
 *
 * Pattern: Follows OutputBuilder composition pattern per decision dec_34f667f7.
 */
export class SessionStartOutputBuilder {
  private readonly builder: TerminalOutputBuilder;
  private readonly sessionContextOutputBuilder: SessionContextOutputBuilder;
  private readonly sessionGoalsOutputBuilder: SessionGoalsOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
    this.sessionContextOutputBuilder = new SessionContextOutputBuilder();
    this.sessionGoalsOutputBuilder = new SessionGoalsOutputBuilder();
  }

  /**
   * Build complete human-readable session start output.
   * Composes project context, session summary, goals, and LLM instructions.
   */
  buildSessionStartOutput(context: EnrichedSessionContext): TerminalOutput {
    this.builder.reset();

    const contextOutput = this.sessionContextOutputBuilder.buildSessionContext(context);
    for (const section of contextOutput.getSections()) {
      if (section.type === "prompt" && section.content) {
        this.builder.addPrompt(section.content as string);
      }
    }

    const allGoals = [
      ...context.context.activeGoals,
      ...context.context.pausedGoals,
      ...context.context.plannedGoals,
    ];
    const goalsOutput = this.sessionGoalsOutputBuilder.buildGoalsOutput(allGoals);
    for (const section of goalsOutput.getSections()) {
      if (section.type === "prompt" && section.content) {
        this.builder.addPrompt(section.content as string);
      }
    }

    return this.builder.build();
  }

  /**
   * Build structured JSON output for session start command.
   */
  buildStructuredOutput(context: EnrichedSessionContext, sessionId: string): Record<string, unknown> {
    const allGoals = [
      ...context.context.activeGoals,
      ...context.context.pausedGoals,
      ...context.context.plannedGoals,
    ];

    const contextData = this.sessionContextOutputBuilder.buildStructuredSessionContext(context);
    const goalsData = this.sessionGoalsOutputBuilder.buildStructuredGoals(allGoals);

    return {
      projectContext: contextData.projectContext,
      sessionContext: contextData.sessionContext,
      goals: goalsData.goals,
      llmInstructions: {
        sessionContext: contextData.llmSessionContextInstruction,
        goalStart: goalsData.llmGoalStartInstruction,
      },
      sessionStart: {
        sessionId,
      },
    };
  }
}
