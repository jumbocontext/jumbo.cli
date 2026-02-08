import { ResumeWorkCommand } from "./ResumeWorkCommand.js";
import { IWorkerIdentityReader } from "../../host/workers/IWorkerIdentityReader.js";
import { IGoalStatusReader } from "../../goals/IGoalStatusReader.js";
import { IGoalResumedEventWriter } from "../../goals/resume/IGoalResumedEventWriter.js";
import { IGoalResumedEventReader } from "../../goals/resume/IGoalResumedEventReader.js";
import { IGoalReader } from "../../goals/resume/IGoalReader.js";
import { IEventBus } from "../../messaging/IEventBus.js";
import { ResumeGoalCommandHandler } from "../../goals/resume/ResumeGoalCommandHandler.js";
import { ResumeGoalCommand } from "../../goals/resume/ResumeGoalCommand.js";
import { GoalClaimPolicy } from "../../goals/claims/GoalClaimPolicy.js";
import { ISettingsReader } from "../../settings/ISettingsReader.js";
import { GoalStatus } from "../../../domain/goals/Constants.js";
import { GoalView } from "../../goals/GoalView.js";
import { SessionContextQueryHandler } from "../../sessions/get-context/SessionContextQueryHandler.js";
import { SessionResumeContextEnricher } from "../../sessions/get-context/SessionResumeContextEnricher.js";
import { SessionContextView } from "../../sessions/get-context/SessionContext.js";
import { ISessionSummaryReader } from "../../sessions/get-context/ISessionSummaryReader.js";
import { IProjectContextReader } from "../../project/query/IProjectContextReader.js";
import { IAudienceContextReader } from "../../audiences/query/IAudienceContextReader.js";
import { IAudiencePainContextReader } from "../../audience-pains/query/IAudiencePainContextReader.js";
import { UnprimedBrownfieldQualifier } from "../../UnprimedBrownfieldQualifier.js";

/**
 * Result of resuming work.
 */
export interface ResumeWorkResult {
  readonly goalId: string;
  readonly objective: string;
  readonly sessionContext: SessionContextView;
}

/**
 * Handles resuming the current worker's paused goal.
 * Queries for the goal in PAUSED status claimed by the current worker,
 * then delegates to ResumeGoalCommandHandler and assembles session context.
 */
export class ResumeWorkCommandHandler {
  private readonly sessionContextQueryHandler: SessionContextQueryHandler;
  private readonly enricher: SessionResumeContextEnricher;

  constructor(
    private readonly workerIdentityReader: IWorkerIdentityReader,
    private readonly goalStatusReader: IGoalStatusReader,
    private readonly goalResumedEventWriter: IGoalResumedEventWriter,
    private readonly goalResumedEventReader: IGoalResumedEventReader,
    private readonly goalReader: IGoalReader,
    private readonly eventBus: IEventBus,
    private readonly claimPolicy: GoalClaimPolicy,
    private readonly settingsReader: ISettingsReader,
    sessionSummaryReader: ISessionSummaryReader,
    projectContextReader?: IProjectContextReader,
    audienceContextReader?: IAudienceContextReader,
    audiencePainContextReader?: IAudiencePainContextReader,
    unprimedBrownfieldQualifier?: UnprimedBrownfieldQualifier
  ) {
    this.sessionContextQueryHandler = new SessionContextQueryHandler(
      sessionSummaryReader,
      goalStatusReader,
      projectContextReader,
      audienceContextReader,
      audiencePainContextReader,
      unprimedBrownfieldQualifier
    );
    this.enricher = new SessionResumeContextEnricher();
  }

  async execute(_command: ResumeWorkCommand): Promise<ResumeWorkResult> {
    // 1. Get current worker's identity
    const workerId = this.workerIdentityReader.workerId;

    // 2. Query for goals in 'paused' status
    const pausedGoals = await this.goalStatusReader.findByStatus(GoalStatus.PAUSED);

    // 3. Find the goal claimed by this worker
    const pausedGoal = pausedGoals.find(
      (goal: GoalView) => goal.claimedBy === workerId
    );

    if (!pausedGoal) {
      throw new Error("No paused goal found for current worker");
    }

    // 4. Create ResumeGoalCommandHandler with atomic dependencies
    const resumeGoalCommandHandler = new ResumeGoalCommandHandler(
      this.goalResumedEventWriter,
      this.goalResumedEventReader,
      this.goalReader,
      this.eventBus,
      this.claimPolicy,
      this.workerIdentityReader,
      this.settingsReader
    );

    // 5. Create and execute ResumeGoalCommand
    const resumeCommand: ResumeGoalCommand = {
      goalId: pausedGoal.goalId
    };

    await resumeGoalCommandHandler.execute(resumeCommand);

    // 6. Assemble session context with resume-specific enrichment
    const baseContext = await this.sessionContextQueryHandler.execute();
    const sessionContext = this.enricher.enrich(baseContext);

    return {
      goalId: pausedGoal.goalId,
      objective: pausedGoal.objective,
      sessionContext,
    };
  }
}
