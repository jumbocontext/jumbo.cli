/**
 * CLI Command: jumbo goal resume
 *
 * Resumes work on a goal by loading its full context.
 * If the goal is 'paused', transitions it to 'doing' status.
 * If the goal is already 'doing', just reloads context (idempotent).
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { ResumeGoalCommandHandler } from "../../../../../application/goals/resume/ResumeGoalCommandHandler.js";
import { ResumeGoalCommand } from "../../../../../application/goals/resume/ResumeGoalCommand.js";
import { GetGoalContextQueryHandler } from "../../../../../application/goals/get-context/GetGoalContextQueryHandler.js";
import { GoalContextRenderer } from "../start/GoalContextRenderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Resume work on a goal (transitions 'paused' to 'doing', or reloads context if already 'doing')",
  category: "work",
  requiredOptions: [
    {
      flags: "--goal-id <goalId>",
      description: "ID of the goal to resume"
    }
  ],
  options: [
    {
      flags: "--note <note>",
      description: "Optional note about resumption (only used when transitioning from 'paused')"
    }
  ],
  examples: [
    {
      command: "jumbo goal resume --goal-id goal_abc123",
      description: "Resume working on a paused or in-progress goal"
    },
    {
      command: "jumbo goal resume --goal-id goal_abc123 --note \"Ready to continue\"",
      description: "Resume a paused goal with a note"
    }
  ],
  related: ["goal pause", "goal start", "goal complete"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalResume(options: { goalId: string; note?: string }, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Query goal context to check current status
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

    const goalContext = await getGoalContext.execute(options.goalId);

    // 2. Validate goal exists
    if (!goalContext.goal) {
      renderer.error("Goal not found", `No goal exists with ID: ${options.goalId}`);
      process.exit(1);
    }

    // 3. If paused, transition to 'doing' status
    if (goalContext.goal.status === "paused") {
      const commandHandler = new ResumeGoalCommandHandler(
        container.goalResumedEventStore,
        container.goalResumedEventStore,
        container.goalResumedProjector,
        container.eventBus,
        container.goalClaimPolicy,
        container.workerIdentityReader,
        container.settingsReader
      );

      const command: ResumeGoalCommand = {
        goalId: options.goalId,
        note: options.note
      };
      await commandHandler.execute(command);

      // Re-fetch context after status change
      const updatedContext = await getGoalContext.execute(options.goalId);

      // 4. Format and render goal context
      const goalContextFormatter = new GoalContextRenderer(renderer);
      
      goalContextFormatter.render(updatedContext);

      renderer.info("---\n");

      // LLM Guidance
      const llmInstruction = [
        "@LLM: Goal context loaded. Work within scope.",
        "YOUR ROLE: Proactively run jumbo commands to capture project memories as they surface.",
        "Run 'jumbo --help' to see what can be tracked, if you haven't already.",
      ];
      renderer.info(llmInstruction.join("\n") + "\n");

      return;
    }

    // 4. If already 'doing', just validate and render context (idempotent)
    if (goalContext.goal.status !== "doing") {
      renderer.error(
        "Goal cannot be resumed",
        `Goal status is '${goalContext.goal.status}'. Use 'jumbo goal start' for to-do goals or 'jumbo goal unblock' for blocked goals.`
      );
      process.exit(1);
    }

    // 5. Format and render goal context
    const goalContextFormatter = new GoalContextRenderer(renderer);
    goalContextFormatter.render(goalContext);

    renderer.info("---\n");

    // LLM Guidance
    const additionalLlmInstructions = [
      "@LLM: Goal context loaded. Work within scope.",
    ];
    renderer.info(additionalLlmInstructions.join("\n") + "\n");

    // Prominent Review Instructions
    renderer.divider();
    renderer.headline("🚀 IMPORTANT NEXT STEP");
    renderer.info(`Run: jumbo goal review --goal-id ${options.goalId}`);
    renderer.divider();

  } catch (error) {
    renderer.error("Failed to resume goal", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
