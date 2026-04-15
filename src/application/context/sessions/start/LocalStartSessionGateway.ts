import { IStartSessionGateway } from "./IStartSessionGateway.js";
import { SessionStartRequest } from "./SessionStartRequest.js";
import { SessionStartResponse } from "./SessionStartResponse.js";
import { StartSessionCommandHandler } from "./StartSessionCommandHandler.js";
import { SessionContextQueryHandler } from "../get/SessionContextQueryHandler.js";
import { IBrownfieldStatusReader } from "./IBrownfieldStatusReader.js";
import { IArchitectureReader } from "../../architecture/IArchitectureReader.js";
import { ContextualSessionView } from "../get/ContextualSessionView.js";
import { SessionInstructionSignal } from "../SessionInstructionSignal.js";

export class LocalStartSessionGateway implements IStartSessionGateway {
  constructor(
    private readonly sessionContextQueryHandler: SessionContextQueryHandler,
    private readonly startSessionCommandHandler: StartSessionCommandHandler,
    private readonly brownfieldStatusReader: IBrownfieldStatusReader,
    private readonly architectureReader?: IArchitectureReader,
  ) {}

  async startSession(request: SessionStartRequest): Promise<SessionStartResponse> {
    // 1. Assemble base session context
    const contextualSessionView = await this.sessionContextQueryHandler.execute();

    // 2. Check brownfield status
    const isUnprimed = await this.brownfieldStatusReader.isUnprimed();

    // 3. Check architecture existence for deprecation notice
    const architectureExists = this.architectureReader
      ? (await this.architectureReader.find()) !== null
      : false;

    // 4. Build start-specific instructions
    const instructions = this.buildStartInstructions(contextualSessionView, isUnprimed, architectureExists);

    // 5. Execute session start command
    const result = await this.startSessionCommandHandler.execute({});

    // 6. Return enriched context with session ID
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
    isUnprimed: boolean,
    architectureExists: boolean
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

    if (architectureExists) {
      instructions.push(SessionInstructionSignal.ARCHITECTURE_DEPRECATED);
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
