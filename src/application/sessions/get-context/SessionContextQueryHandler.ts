import { ISessionSummaryReader } from "./ISessionSummaryReader.js";
import { IGoalStatusReader } from "../../goals/IGoalStatusReader.js";
import { SessionContext } from "./SessionContext.js";
import { GoalStatus } from "../../../domain/goals/Constants.js";
import { IProjectContextReader } from "../../project/query/IProjectContextReader.js";
import { IAudienceContextReader } from "../../audiences/query/IAudienceContextReader.js";
import { IAudiencePainContextReader } from "../../audience-pains/query/IAudiencePainContextReader.js";
import { UnprimedBrownfieldQualifier } from "../../../application/UnprimedBrownfieldQualifier.js";

/**
 * SessionContextQueryHandler - Builds the reusable base session context
 *
 * Assembles event-agnostic session orientation data from multiple projection stores.
 * Used by event-specific query handlers (SessionStartContextQueryHandler, etc.)
 * that compose this base context with event-specific enrichment.
 */
export class SessionContextQueryHandler {
  constructor(
    private readonly sessionSummaryReader: ISessionSummaryReader,
    private readonly goalStatusReader: IGoalStatusReader,
    private readonly projectContextReader?: IProjectContextReader,
    private readonly audienceContextReader?: IAudienceContextReader,
    private readonly audiencePainContextReader?: IAudiencePainContextReader,
    private readonly unprimedBrownfieldQualifier?: UnprimedBrownfieldQualifier
  ) {}

  /**
   * Execute query to assemble base session context
   *
   * Assembles:
   * 1. Project context (name, purpose, audiences, pains)
   * 2. Latest session summary (historical context)
   * 3. In-progress goals (current active work)
   * 4. Planned goals (available work)
   * 5. Solution context presence
   *
   * @returns SessionContext with all assembled data
   */
  async execute(): Promise<SessionContext> {
    const doingGoals = await this.goalStatusReader.findByStatus(GoalStatus.DOING);
    const pausedGoals = await this.goalStatusReader.findByStatus(GoalStatus.PAUSED);
    const blockedGoals = await this.goalStatusReader.findByStatus(GoalStatus.BLOCKED);

    // Query all projection stores in parallel for efficiency
    const [
      project,
      audiences,
      audiencePains,
      latestSessionSummary,
      plannedGoals,
      isUnprimed,
    ] = await Promise.all([
      this.projectContextReader?.getProject() ?? Promise.resolve(null),
      this.audienceContextReader?.findAllActive() ?? Promise.resolve([]),
      this.audiencePainContextReader?.findAllActive() ?? Promise.resolve([]),
      this.sessionSummaryReader.findLatest(),
      this.goalStatusReader.findByStatus(GoalStatus.TODO),
      this.unprimedBrownfieldQualifier?.isUnprimed() ?? Promise.resolve(false),
    ]);

    const projectContext = project
      ? { project, audiences, audiencePains }
      : null;

    const inProgressGoals = doingGoals.concat(pausedGoals, blockedGoals);

    return {
      projectContext,
      latestSessionSummary,
      inProgressGoals,
      plannedGoals,
      hasSolutionContext: !isUnprimed,
    };
  }
}
