import { ReviewGoalRequest } from "./ReviewGoalRequest.js";
import { ReviewGoalResponse } from "./ReviewGoalResponse.js";
import { SubmitGoalForReviewCommandHandler } from "./SubmitGoalForReviewCommandHandler.js";
import { GetGoalContextQueryHandler } from "../get-context/GetGoalContextQueryHandler.js";
import { IGoalSubmitForReviewReader } from "./IGoalSubmitForReviewReader.js";
import { GoalErrorMessages, formatErrorMessage } from "../../../domain/goals/Constants.js";
import { GoalClaimPolicy } from "../claims/GoalClaimPolicy.js";
import { IWorkerIdentityReader } from "../../host/workers/IWorkerIdentityReader.js";

/**
 * ReviewGoalController
 *
 * Controller for goal review submission requests.
 * Orchestrates the submit-for-review flow.
 *
 * Responsibilities:
 * - Validates claim ownership (only the claimant can submit for review)
 * - Delegates state change to SubmitGoalForReviewCommandHandler
 * - Returns criteria context for QA verification
 */
export class ReviewGoalController {
  constructor(
    private readonly submitGoalForReviewCommandHandler: SubmitGoalForReviewCommandHandler,
    private readonly getGoalContextQueryHandler: GetGoalContextQueryHandler,
    private readonly goalReader: IGoalSubmitForReviewReader,
    private readonly claimPolicy: GoalClaimPolicy,
    private readonly workerIdentityReader: IWorkerIdentityReader
  ) {}

  async handle(request: ReviewGoalRequest): Promise<ReviewGoalResponse> {
    // 1. Validate claim ownership - only the claimant can submit for review
    const workerId = this.workerIdentityReader.workerId;
    const claimValidation = this.claimPolicy.canClaim(request.goalId, workerId);
    if (!claimValidation.allowed) {
      throw new Error(
        formatErrorMessage(GoalErrorMessages.GOAL_CLAIMED_BY_ANOTHER_WORKER, {
          expiresAt: claimValidation.existingClaim.claimExpiresAt,
        })
      );
    }

    // 2. Get current goal view to validate existence
    const goalView = await this.goalReader.findById(request.goalId);
    if (!goalView) {
      throw new Error(
        formatErrorMessage(GoalErrorMessages.GOAL_NOT_FOUND, { id: request.goalId })
      );
    }

    // 3. Delegate state change to command handler (validates status transitions)
    await this.submitGoalForReviewCommandHandler.execute({ goalId: request.goalId });

    // 4. Get updated goal view after state change
    const updatedGoalView = await this.goalReader.findById(request.goalId);
    if (!updatedGoalView) {
      throw new Error(`Goal not found after review submission: ${request.goalId}`);
    }

    // 5. Get full goal context (criteria, components, invariants, etc.) for QA verification
    const goalContext = await this.getGoalContextQueryHandler.execute(request.goalId);

    return {
      goalId: request.goalId,
      objective: updatedGoalView.objective,
      status: updatedGoalView.status,
      criteria: goalContext,
    };
  }
}
