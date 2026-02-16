import { SubmitGoalForReviewCommand } from "./SubmitGoalForReviewCommand.js";
import { IGoalSubmittedForReviewEventWriter } from "./IGoalSubmittedForReviewEventWriter.js";
import { IGoalSubmittedForReviewEventReader } from "./IGoalSubmittedForReviewEventReader.js";
import { IGoalSubmitForReviewReader } from "./IGoalSubmitForReviewReader.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { Goal } from "../../../../domain/goals/Goal.js";
import { GoalErrorMessages, formatErrorMessage } from "../../../../domain/goals/Constants.js";
import { GoalClaimPolicy } from "../claims/GoalClaimPolicy.js";
import { IWorkerIdentityReader } from "../../../host/workers/IWorkerIdentityReader.js";
import { GoalContextQueryHandler } from "../get/GoalContextQueryHandler.js";
import { ContextualGoalView } from "../get/ContextualGoalView.js";

/**
 * Handles submission of a goal for QA review.
 * Loads aggregate from event history, calls domain logic, persists event.
 * Validates claim ownership before allowing submission.
 * Returns ContextualGoalView for presentation layer.
 */
export class SubmitGoalForReviewCommandHandler {
  constructor(
    private readonly eventWriter: IGoalSubmittedForReviewEventWriter,
    private readonly eventReader: IGoalSubmittedForReviewEventReader,
    private readonly goalReader: IGoalSubmitForReviewReader,
    private readonly eventBus: IEventBus,
    private readonly claimPolicy: GoalClaimPolicy,
    private readonly workerIdentityReader: IWorkerIdentityReader,
    private readonly goalContextQueryHandler: GoalContextQueryHandler
  ) {}

  async execute(command: SubmitGoalForReviewCommand): Promise<ContextualGoalView> {
    // 1. Check goal exists (query projection for fast check)
    const view = await this.goalReader.findById(command.goalId);
    if (!view) {
      throw new Error(
        formatErrorMessage(GoalErrorMessages.GOAL_NOT_FOUND, { id: command.goalId })
      );
    }

    // 2. Validate claim ownership - only the claimant can submit for review
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
    const event = goal.submitForReview();

    // 5. Persist event to file store
    await this.eventWriter.append(event);

    // 6. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    // 7. Query goal context
    return this.goalContextQueryHandler.execute(command.goalId);
  }
}
