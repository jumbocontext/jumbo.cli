import { UpdateGoalCommand } from "./UpdateGoalCommand.js";
import { IGoalUpdatedEventWriter } from "./IGoalUpdatedEventWriter.js";
import { IGoalUpdatedEventReader } from "./IGoalUpdatedEventReader.js";
import { IGoalUpdateReader } from "./IGoalUpdateReader.js";
import { IEventBus } from "../../messaging/IEventBus.js";
import { Goal } from "../../../domain/goals/Goal.js";
import { GoalErrorMessages, formatErrorMessage } from "../../../domain/goals/Constants.js";

/**
 * Application layer command handler for updating a goal.
 * Orchestrates: load aggregate - domain logic - persist event - publish to bus
 */
export class UpdateGoalCommandHandler {
  constructor(
    private readonly eventWriter: IGoalUpdatedEventWriter,
    private readonly eventReader: IGoalUpdatedEventReader,
    private readonly goalReader: IGoalUpdateReader,
    private readonly eventBus: IEventBus
  ) {}

  async execute(command: UpdateGoalCommand): Promise<{ goalId: string }> {
    // 1. Check if goal exists
    const existingGoal = await this.goalReader.findById(command.goalId);
    if (!existingGoal) {
      throw new Error(
        formatErrorMessage(GoalErrorMessages.NOT_FOUND, {
          goalId: command.goalId,
        })
      );
    }

    // 2. Rehydrate aggregate from event history
    const history = await this.eventReader.readStream(command.goalId);
    const goal = Goal.rehydrate(command.goalId, history as any);

    // 3. Build embedded context object if any embedded fields provided
    const embeddedContext = (
      command.relevantInvariants !== undefined ||
      command.relevantGuidelines !== undefined ||
      command.relevantDependencies !== undefined ||
      command.relevantComponents !== undefined ||
      command.architecture !== undefined ||
      command.filesToBeCreated !== undefined ||
      command.filesToBeChanged !== undefined ||
      command.nextGoalId !== undefined
    ) ? {
      relevantInvariants: command.relevantInvariants,
      relevantGuidelines: command.relevantGuidelines,
      relevantDependencies: command.relevantDependencies,
      relevantComponents: command.relevantComponents,
      architecture: command.architecture,
      filesToBeCreated: command.filesToBeCreated,
      filesToBeChanged: command.filesToBeChanged,
      nextGoalId: command.nextGoalId,
    } : undefined;

    // 4. Domain logic produces event
    const event = goal.update(
      command.objective,
      command.successCriteria,
      command.scopeIn,
      command.scopeOut,
      command.boundaries,
      embeddedContext
    );

    // 5. Persist event to file store
    await this.eventWriter.append(event);

    // 6. Publish event to bus (projections update asynchronously)
    await this.eventBus.publish(event);

    return { goalId: command.goalId };
  }
}
