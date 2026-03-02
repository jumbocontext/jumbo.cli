import { ISessionViewReader } from "./ISessionViewReader.js";
import { IGoalStatusReader } from "../../goals/IGoalStatusReader.js";
import { IDecisionViewReader } from "../../decisions/get/IDecisionViewReader.js";
import { ContextualSessionView } from "./ContextualSessionView.js";
import { GoalStatus } from "../../../../domain/goals/Constants.js";
import { IProjectContextReader } from "../../project/query/IProjectContextReader.js";
import { IAudienceContextReader } from "../../audiences/query/IAudienceContextReader.js";
import { IAudiencePainContextReader } from "../../audience-pains/query/IAudiencePainContextReader.js";
import { IRelationViewReader } from "../../relations/get/IRelationViewReader.js";

/**
 * SessionContextQueryHandler - Builds the reusable base session context
 *
 * Assembles session orientation data from multiple view readers using the multi-query pattern.
 * All queries run in parallel via Promise.all for optimal performance.
 * Returns a ContextualSessionView pairing the active session with its context.
 * Used by controllers (SessionStartController, ResumeWorkController)
 * that compose this base view with event-specific enrichment.
 */
export class SessionContextQueryHandler {
  constructor(
    private readonly sessionViewReader: ISessionViewReader,
    private readonly goalStatusReader: IGoalStatusReader,
    private readonly decisionViewReader: IDecisionViewReader,
    private readonly relationViewReader: IRelationViewReader,
    private readonly projectContextReader?: IProjectContextReader,
    private readonly audienceContextReader?: IAudienceContextReader,
    private readonly audiencePainContextReader?: IAudiencePainContextReader
  ) {}

  /**
   * Execute query to assemble base session context
   *
   * Assembles from multiple view readers in parallel:
   * 1. Active session (SessionView or null)
   * 2. Goal categories (active, paused, planned)
   * 3. Recent decisions
   * 4. Project context (name, purpose, audiences, pains)
   *
   * @returns ContextualSessionView with session and assembled context
   */
  async execute(): Promise<ContextualSessionView> {
    // Query all view readers in parallel for efficiency
    const [
      activeSession,
      doingGoals,
      blockedGoals,
      inReviewGoals,
      qualifiedGoals,
      pausedGoals,
      todoGoals,
      refinedGoals,
      activeDecisions,
      deactivatedRelations,
      project,
      audiences,
      audiencePains,
    ] = await Promise.all([
      this.sessionViewReader.findActive(),
      this.goalStatusReader.findByStatus(GoalStatus.DOING),
      this.goalStatusReader.findByStatus(GoalStatus.BLOCKED),
      this.goalStatusReader.findByStatus(GoalStatus.INREVIEW),
      this.goalStatusReader.findByStatus(GoalStatus.QUALIFIED),
      this.goalStatusReader.findByStatus(GoalStatus.PAUSED),
      this.goalStatusReader.findByStatus(GoalStatus.TODO),
      this.goalStatusReader.findByStatus(GoalStatus.REFINED),
      this.decisionViewReader.findAll("active"),
      this.relationViewReader.findAll({ status: "deactivated" }),
      this.projectContextReader?.getProject() ?? Promise.resolve(null),
      this.audienceContextReader?.findAllActive() ?? Promise.resolve([]),
      this.audiencePainContextReader?.findAllActive() ?? Promise.resolve([]),
    ]);

    const projectContext = project
      ? { project, audiences, audiencePains }
      : null;

    const activeGoals = doingGoals.concat(blockedGoals, inReviewGoals, qualifiedGoals);
    const plannedGoals = todoGoals.concat(refinedGoals);

    // Limit to 10 most recent decisions, sorted by creation date (newest first)
    const recentDecisions = activeDecisions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
    const deactivatedRelationsSummary =
      deactivatedRelations.length === 0
        ? {
            count: 0,
            summary: "No deactivated relations.",
          }
        : {
            count: deactivatedRelations.length,
            summary: deactivatedRelations
              .slice(0, 3)
              .map(
                (relation) =>
                  `${relation.fromEntityType}:${relation.fromEntityId} -> ${relation.toEntityType}:${relation.toEntityId}`
              )
              .join("; "),
          };

    return {
      session: activeSession ?? null,
      context: {
        projectContext,
        activeGoals,
        pausedGoals,
        plannedGoals,
        recentDecisions,
        deactivatedRelations: deactivatedRelationsSummary,
      },
    };
  }
}
