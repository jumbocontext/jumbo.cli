import { PauseWorkCommand } from "./PauseWorkCommand.js";
import { IWorkerIdentityReader } from "../../host/workers/IWorkerIdentityReader.js";
import { IGoalStatusReader } from "../../goals/IGoalStatusReader.js";
import { IGoalPausedEventWriter } from "../../goals/pause/IGoalPausedEventWriter.js";
import { IGoalPausedEventReader } from "../../goals/pause/IGoalPausedEventReader.js";
import { IGoalReader } from "../../goals/pause/IGoalReader.js";
import { IEventBus } from "../../messaging/IEventBus.js";
import { PauseGoalCommandHandler } from "../../goals/pause/PauseGoalCommandHandler.js";
import { PauseGoalCommand } from "../../goals/pause/PauseGoalCommand.js";
import { GoalPausedReasons } from "../../../domain/goals/GoalPausedReasons.js";
import { GoalStatus } from "../../../domain/goals/Constants.js";
import { GoalView } from "../../goals/GoalView.js";

/**
 * Result of pausing work.
 */
export interface PauseWorkResult {
  readonly goalId: string;
  readonly objective: string;
}

/**
 * Handles pausing the current worker's active goal.
 * Queries for the goal in DOING status claimed by the current worker,
 * then delegates to PauseGoalCommandHandler with reason 'WorkPaused'.
 */
export class PauseWorkCommandHandler {
  constructor(
    private readonly workerIdentityReader: IWorkerIdentityReader,
    private readonly goalStatusReader: IGoalStatusReader,
    private readonly goalPausedEventWriter: IGoalPausedEventWriter,
    private readonly goalPausedEventReader: IGoalPausedEventReader,
    private readonly goalReader: IGoalReader,
    private readonly eventBus: IEventBus
  ) {}

  async execute(_command: PauseWorkCommand): Promise<PauseWorkResult> {
    // 1. Get current worker's identity
    const workerId = this.workerIdentityReader.workerId;

    // 2. Query for goals in 'doing' status
    const doingGoals = await this.goalStatusReader.findByStatus(GoalStatus.DOING);

    // 3. Find the goal claimed by this worker
    const activeGoal = doingGoals.find(
      (goal: GoalView) => goal.claimedBy === workerId
    );

    if (!activeGoal) {
      throw new Error("No active goal found for current worker");
    }

    // 4. Create PauseGoalCommandHandler with atomic dependencies
    const pauseGoalCommandHandler = new PauseGoalCommandHandler(
      this.goalPausedEventWriter,
      this.goalPausedEventReader,
      this.goalReader,
      this.eventBus
    );

    // 5. Create and execute PauseGoalCommand
    const pauseCommand: PauseGoalCommand = {
      goalId: activeGoal.goalId,
      reason: GoalPausedReasons.WorkPaused
    };

    await pauseGoalCommandHandler.execute(pauseCommand);

    return {
      goalId: activeGoal.goalId,
      objective: activeGoal.objective
    };
  }
}
