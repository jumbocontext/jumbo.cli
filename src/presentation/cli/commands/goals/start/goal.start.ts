/**
 * CLI Command: jumbo goal start
 *
 * Starts a defined goal (transitions status from 'to-do' to 'doing').
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { StartGoalCommandHandler } from "../../../../../application/goals/start/StartGoalCommandHandler.js";
import { StartGoalCommand } from "../../../../../application/goals/start/StartGoalCommand.js";
import { GetGoalContextQueryHandler } from "../../../../../application/goals/get-context/GetGoalContextQueryHandler.js";
import { GoalContextRenderer } from "./GoalContextRenderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Start a defined goal (transitions status from 'to-do' to 'doing')",
  category: "work",
  requiredOptions: [
    {
      flags: "--goal-id <goalId>",
      description: "[required]ID of the goal to start"
    }
  ],
  examples: [
    {
      command: "jumbo goal start --goal-id goal_abc123",
      description: "Start working on the goal with ID 'goal_abc123'"
    }
  ],
  related: ["goal update-progress", "goal complete"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalStart(options: { goalId: string }, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Create command handler
    const commandHandler = new StartGoalCommandHandler(
      container.goalStartedEventStore,
      container.goalStartedEventStore,
      container.goalStartedProjector,
      container.eventBus,
      container.goalClaimPolicy,
      container.workerIdentityReader,
      container.settingsReader
    );

    // 2. Execute command
    const command: StartGoalCommand = { goalId: options.goalId };
    const result = await commandHandler.execute(command);

    // 3. Fetch updated view for display
    const view = await container.goalStartedProjector.findById(result.goalId);

    // 4. Query and render goal context
    const getGoalContext = new GetGoalContextQueryHandler(
      container.goalContextReader,
      container.componentContextReader,
      container.dependencyContextReader,
      container.decisionContextReader,
      container.invariantContextReader,
      container.guidelineContextReader,
      container.architectureReader,
      container.relationRemovedProjector
    );
    const goalContextRenderer = new GoalContextRenderer(renderer);

    const goalContext = await getGoalContext.execute(result.goalId);
    
    goalContextRenderer.render(goalContext);

    renderer.info("---\n");

    // LLM Guidance
    const additionalLlmInstructions = [
      "@LLM: Goal context loaded. Work within scope and boundaries.",
      "Track your progress by documenting completed sub-tasks with 'jumbo goal update-progress --goal-id " + options.goalId + " --task-description <description>'.",
    ];
    renderer.info(additionalLlmInstructions.join("\n") + "\n");

    // Prominent Review Instructions
    renderer.divider();
    renderer.headline("🚀 WHEN YOU'RE FINISHED IMPLEMENTING THEN THE NEXT STEP IS:");
    renderer.info(`Run: jumbo goal review --goal-id ${options.goalId}`);
    renderer.divider();

  } catch (error) {
    renderer.error("Failed to start goal", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
