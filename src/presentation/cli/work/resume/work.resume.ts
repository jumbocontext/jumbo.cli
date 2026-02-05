/**
 * CLI Command: jumbo work resume
 *
 * Resumes the current worker's paused goal (transitions status from 'paused' to 'doing').
 * This is a parameterless command that automatically identifies the worker's paused goal.
 * Returns full goal context with continuation prompt for the LLM.
 */

import { CommandMetadata } from "../../shared/registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../shared/rendering/Renderer.js";
import { ResumeWorkCommandHandler } from "../../../../application/work/resume/ResumeWorkCommandHandler.js";
import { GetGoalContextQueryHandler } from "../../../../application/work/goals/get-context/GetGoalContextQueryHandler.js";
import { GoalContextRenderer } from "../goals/start/GoalContextRenderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Resume the current worker's paused goal",
  category: "work",
  requiredOptions: [],
  options: [],
  examples: [
    {
      command: "jumbo work resume",
      description: "Resume your paused goal and get context"
    }
  ],
  related: ["work pause", "goal resume", "goal start"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function workResume(
  _options: Record<string, never>,
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Create command handler with dependencies from container
    const commandHandler = new ResumeWorkCommandHandler(
      container.workerIdentityReader,
      container.goalStatusReader,
      container.goalResumedEventStore,
      container.goalResumedEventStore,
      container.goalResumedProjector,
      container.eventBus,
      container.goalClaimPolicy,
      container.settingsReader
    );

    // 2. Execute command
    const result = await commandHandler.execute({});

    // 3. Query and render goal context (like goal.start does)
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

    // 5. LLM Guidance - continuation prompt
    const llmInstruction = [
      "INSTRUCTION: You're work was previously interrupted. Continue working on this goal.",
      "Determine where you left off based on the registered progress and resume from there.",
      "Register completed sub-tasks via 'jumbo goal update-progress --help'.",
    ];
    
    renderer.info(llmInstruction.join("\n") + "\n");

    // 6. Success output
    renderer.success("Work resumed", {
      goalId: result.goalId,
      objective: result.objective,
      status: "doing"
    });
  } catch (error) {
    renderer.error("Failed to resume work", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
