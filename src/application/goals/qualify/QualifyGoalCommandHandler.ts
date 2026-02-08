import { QualifyGoalCommand } from "./QualifyGoalCommand.js";
import { IGoalQualifiedEventWriter } from "./IGoalQualifiedEventWriter.js";
import { IGoalQualifiedEventReader } from "./IGoalQualifiedEventReader.js";
import { IGoalQualifyReader } from "./IGoalQualifyReader.js";
import { IEventBus } from "../../messaging/IEventBus.js";
import { Goal } from "../../../domain/goals/Goal.js";
import { GoalErrorMessages, formatErrorMessage } from "../../../domain/goals/Constants.js";
import { GoalClaimPolicy } from "../claims/GoalClaimPolicy.js";
import { IWorkerIdentityReader } from "../../host/workers/IWorkerIdentityReader.js";

/**
 * Handles qualification of a goal after successful QA review.
 * Loads aggregate from event history, calls domain logic, persists event.
 */
export class QualifyGoalCommandHandler {
  constructor(
    private readonly eventWriter: IGoalQualifiedEventWriter,
    private readonly eventReader: IGoalQualifiedEventReader,
    private readonly goalReader: IGoalQualifyReader,
    private readonly eventBus: IEventBus,
    private readonly claimPolicy: GoalClaimPolicy,
    private readonly workerIdentityReader: IWorkerIdentityReader
  ) {}

  async execute(command: QualifyGoalCommand): Promise<{ goalId: string }> {
    // 1. Check goal exists (query projection for fast check)
    const view = await this.goalReader.findById(command.goalId);
    if (!view) {
      throw new Error(
        formatErrorMessage(GoalErrorMessages.GOAL_NOT_FOUND, { id: command.goalId })
      );
    }

    // 2. Validate claim ownership - only the claimant can qualify a goal
    const workerId = this.workerIdentityReader.workerId;
    const claimValidation = this.claimPolicy.canClaim(command.goalId, workerId);
    if (!claimValidation.allowed) {
      throw new Error(
        formatErrorMessage(GoalErrorMessages.GOAL_CLAIMED_BY_ANOTHER_WORKER, {
          expiresAt: claimValidation.existingClaim.claimExpiresAt,
        })
      );
    }

    // 3. Rehydrate aggregate from event history (event sourcing)
    const history = await this.eventReader.readStream(command.goalId);
    const goal = Goal.rehydrate(command.goalId, history as any);

    // 4. Domain logic produces event (validates state)
    const event = goal.qualify();

    // 5. Persist event to file store
    await this.eventWriter.append(event);

    // 6. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    return { goalId: command.goalId };
  }
}
