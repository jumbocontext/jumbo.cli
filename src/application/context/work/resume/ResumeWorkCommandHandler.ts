import { ResumeWorkCommand } from "./ResumeWorkCommand.js";
import { IWorkerIdentityReader } from "../../../host/workers/IWorkerIdentityReader.js";
import { IGoalStatusReader } from "../../goals/IGoalStatusReader.js";
import { IGoalResumedEventWriter } from "../../goals/resume/IGoalResumedEventWriter.js";
import { IGoalResumedEventReader } from "../../goals/resume/IGoalResumedEventReader.js";
import { IGoalReader } from "../../goals/resume/IGoalReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { ResumeGoalCommandHandler } from "../../goals/resume/ResumeGoalCommandHandler.js";
import { ResumeGoalCommand } from "../../goals/resume/ResumeGoalCommand.js";
import { GoalClaimPolicy } from "../../goals/claims/GoalClaimPolicy.js";
import { ISettingsReader } from "../../../settings/ISettingsReader.js";
import { GoalStatus } from "../../../../domain/goals/Constants.js";
import { GoalView } from "../../goals/GoalView.js";
import { SessionContextQueryHandler } from "../../sessions/get/SessionContextQueryHandler.js";
import { SessionResumeContextEnricher } from "../../sessions/get/SessionResumeContextEnricher.js";
import { EnrichedSessionContext } from "../../sessions/get/EnrichedSessionContext.js";
import { ISessionViewReader } from "../../sessions/get/ISessionViewReader.js";
import { IDecisionViewReader } from "../../decisions/get/IDecisionViewReader.js";
import { IProjectContextReader } from "../../project/query/IProjectContextReader.js";
import { IAudienceContextReader } from "../../audiences/query/IAudienceContextReader.js";
import { IAudiencePainContextReader } from "../../audience-pains/query/IAudiencePainContextReader.js";
import { GoalContextQueryHandler } from "../../goals/get/GoalContextQueryHandler.js";
import { ILogger } from "../../../logging/ILogger.js";

/**
 * Result of resuming work.
 */
export interface ResumeWorkResult {
  readonly goalId: string;
  readonly objective: string;
  readonly sessionContext: EnrichedSessionContext;
}

/**
 * Handles resuming the current worker's paused goal.
 * Queries for the goal in PAUSED status claimed by the current worker,
 * then delegates to ResumeGoalCommandHandler and assembles session context.
 */
export class ResumeWorkCommandHandler {
  private readonly sessionContextQueryHandler: SessionContextQueryHandler;
  private readonly enricher: SessionResumeContextEnricher;
  private readonly goalContextQueryHandler: GoalContextQueryHandler;

  constructor(
    private readonly workerIdentityReader: IWorkerIdentityReader,
    private readonly goalStatusReader: IGoalStatusReader,
    private readonly goalResumedEventWriter: IGoalResumedEventWriter,
    private readonly goalResumedEventReader: IGoalResumedEventReader,
    private readonly goalReader: IGoalReader,
    private readonly eventBus: IEventBus,
    private readonly claimPolicy: GoalClaimPolicy,
    private readonly settingsReader: ISettingsReader,
    private readonly logger: ILogger,
    sessionViewReader: ISessionViewReader,
    decisionViewReader: IDecisionViewReader,
    goalContextQueryHandler: GoalContextQueryHandler,
    projectContextReader?: IProjectContextReader,
    audienceContextReader?: IAudienceContextReader,
    audiencePainContextReader?: IAudiencePainContextReader
  ) {
    this.sessionContextQueryHandler = new SessionContextQueryHandler(
      sessionViewReader,
      goalStatusReader,
      decisionViewReader,
      projectContextReader,
      audienceContextReader,
      audiencePainContextReader
    );
    this.enricher = new SessionResumeContextEnricher();
    this.goalContextQueryHandler = goalContextQueryHandler;
  }

  async execute(_command: ResumeWorkCommand): Promise<ResumeWorkResult> {
    this.logger.debug("[ResumeWorkCommandHandler] Starting execute");

    // 1. Get current worker's identity
    const workerId = this.workerIdentityReader.workerId;
    this.logger.debug("[ResumeWorkCommandHandler] Worker ID obtained", { workerId });

    // 2. Query for goals in 'paused' status
    const pausedGoals = await this.goalStatusReader.findByStatus(GoalStatus.PAUSED);
    this.logger.info("[ResumeWorkCommandHandler] Queried paused goals", {
      count: pausedGoals.length,
      goals: pausedGoals.map(g => ({ id: g.goalId, claimedBy: g.claimedBy, objective: g.objective }))
    });

    // 3. Find the goal claimed by this worker
    const pausedGoal = pausedGoals.find(
      (goal: GoalView) => goal.claimedBy === workerId
    );

    if (!pausedGoal) {
      const errorContext = {
        workerId,
        pausedGoalsCount: pausedGoals.length,
        allClaimedBy: pausedGoals.map(g => g.claimedBy)
      };

      // Log to file
      this.logger.error("[ResumeWorkCommandHandler] No paused goal found for worker", undefined, errorContext);

      // Write to stderr as JSON
      console.error(JSON.stringify({
        level: "ERROR",
        timestamp: new Date().toISOString(),
        message: "[ResumeWorkCommandHandler] No paused goal found for worker",
        context: errorContext
      }));

      throw new Error("No paused goal found for current worker");
    }

    this.logger.info("[ResumeWorkCommandHandler] Found paused goal for worker", {
      goalId: pausedGoal.goalId,
      objective: pausedGoal.objective
    });

    // 4. Create ResumeGoalCommandHandler with atomic dependencies
    const resumeGoalCommandHandler = new ResumeGoalCommandHandler(
      this.goalResumedEventWriter,
      this.goalResumedEventReader,
      this.goalReader,
      this.eventBus,
      this.claimPolicy,
      this.workerIdentityReader,
      this.settingsReader,
      this.goalContextQueryHandler
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
