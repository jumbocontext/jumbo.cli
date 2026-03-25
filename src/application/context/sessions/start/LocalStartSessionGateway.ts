import { IStartSessionGateway } from "./IStartSessionGateway.js";
import { SessionStartRequest } from "./SessionStartRequest.js";
import { SessionStartResponse } from "./SessionStartResponse.js";
import { StartSessionCommandHandler } from "./StartSessionCommandHandler.js";
import { SessionContextQueryHandler } from "../get/SessionContextQueryHandler.js";
import { IBrownfieldStatusReader } from "./IBrownfieldStatusReader.js";
import { ContextualSessionView } from "../get/ContextualSessionView.js";
import { ActivityMirrorAssembler } from "./ActivityMirrorAssembler.js";
import { SessionInstructionSignal } from "../SessionInstructionSignal.js";

export class LocalStartSessionGateway implements IStartSessionGateway {
  constructor(
    private readonly sessionContextQueryHandler: SessionContextQueryHandler,
    private readonly startSessionCommandHandler: StartSessionCommandHandler,
    private readonly brownfieldStatusReader: IBrownfieldStatusReader,
    private readonly activityMirrorAssembler: ActivityMirrorAssembler
  ) {}

  async startSession(request: SessionStartRequest): Promise<SessionStartResponse> {
    // 1. Assemble base session context
    const contextualSessionView = await this.sessionContextQueryHandler.execute();

    // 2. Check brownfield status
    const isUnprimed = await this.brownfieldStatusReader.isUnprimed();

    // 3. Build start-specific instructions
    const instructions = this.buildStartInstructions(contextualSessionView, isUnprimed);

    // 4. Assemble activity mirror (before session start event is written)
    const activityMirror = await this.activityMirrorAssembler.assemble();

    // 5. Execute session start command
    const result = await this.startSessionCommandHandler.execute({});

    // 6. Return enriched context with session ID and activity mirror
    return {
      context: {
        ...contextualSessionView,
        instructions,
        scope: "session-start",
      },
      sessionId: result.sessionId,
      activityMirror,
    };
  }

  private buildStartInstructions(
    view: ContextualSessionView,
    isUnprimed: boolean
  ): string[] {
    const instructions: string[] = [];

    if (isUnprimed) {
      instructions.push(SessionInstructionSignal.BROWNFIELD_ONBOARDING);
    }

    if (!isUnprimed && this.hasPrimitiveGaps(view)) {
      instructions.push(SessionInstructionSignal.PRIMITIVE_GAPS_DETECTED);
    }

    if (view.context.pausedGoals.length > 0) {
      instructions.push(SessionInstructionSignal.PAUSED_GOALS_RESUME);
    }

    instructions.push(SessionInstructionSignal.GOAL_SELECTION_PROMPT);

    return instructions;
  }

  private hasPrimitiveGaps(view: ContextualSessionView): boolean {
    const projectContext = view.context.projectContext;
    if (!projectContext) {
      return false;
    }

    return (
      projectContext.audiences.length === 0 ||
      projectContext.audiencePains.length === 0 ||
      projectContext.valuePropositions.length === 0
    );
  }
}
