import { SessionStartRequest } from "./SessionStartRequest.js";
import { SessionStartResponse } from "./SessionStartResponse.js";
import { StartSessionCommandHandler } from "./StartSessionCommandHandler.js";
import { SessionContextQueryHandler } from "../get/SessionContextQueryHandler.js";
import { UnprimedBrownfieldQualifier } from "../../../UnprimedBrownfieldQualifier.js";
import { ContextualSessionView } from "../get/ContextualSessionView.js";

/**
 * SessionStartController - Orchestrates the session start flow.
 *
 * Composes context query, brownfield qualification, instruction building,
 * and session creation into a single unified operation.
 *
 * Responsibilities:
 * - Assemble base session context via SessionContextQueryHandler
 * - Determine brownfield status via UnprimedBrownfieldQualifier
 * - Build start-specific LLM instruction signals
 * - Delegate session creation to StartSessionCommandHandler
 * - Return SessionStartResponse with enriched context and session ID
 */
export class SessionStartController {
  constructor(
    private readonly sessionContextQueryHandler: SessionContextQueryHandler,
    private readonly startSessionCommandHandler: StartSessionCommandHandler,
    private readonly unprimedBrownfieldQualifier: UnprimedBrownfieldQualifier
  ) {}

  async handle(request: SessionStartRequest): Promise<SessionStartResponse> {
    // 1. Assemble base session context
    const contextualSessionView = await this.sessionContextQueryHandler.execute();

    // 2. Check brownfield status
    const isUnprimed = await this.unprimedBrownfieldQualifier.isUnprimed();

    // 3. Build start-specific instructions
    const instructions = this.buildStartInstructions(contextualSessionView, isUnprimed);

    // 4. Execute session start command
    const result = await this.startSessionCommandHandler.execute({});

    // 5. Return enriched context with session ID
    return {
      context: {
        ...contextualSessionView,
        instructions,
        scope: "session-start",
      },
      sessionId: result.sessionId,
    };
  }

  private buildStartInstructions(
    view: ContextualSessionView,
    isUnprimed: boolean
  ): string[] {
    const instructions: string[] = [];

    if (isUnprimed) {
      instructions.push("brownfield-onboarding");
    }

    if (view.context.pausedGoals.length > 0) {
      instructions.push("paused-goals-resume");
    }

    instructions.push("goal-selection-prompt");

    return instructions;
  }
}
