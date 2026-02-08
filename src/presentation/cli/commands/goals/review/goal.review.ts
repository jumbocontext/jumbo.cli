/**
 * CLI Command: jumbo goal review
 *
 * Submits a goal for QA review.
 * Transitions goal from 'doing' to 'in-review' status and renders QA criteria.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { ReviewGoalRequest } from "../../../../../application/goals/review/ReviewGoalRequest.js";
import { ReviewGoalResponse } from "../../../../../application/goals/review/ReviewGoalResponse.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Submit a goal for QA review",
  category: "work",
  requiredOptions: [
    {
      flags: "--goal-id <goalId>",
      description: "ID of the goal to submit for review"
    }
  ],
  options: [],
  examples: [
    {
      command: "jumbo goal review --goal-id goal_abc123",
      description: "Submit a goal for QA review"
    }
  ],
  related: ["goal start", "goal qualify", "goal complete", "goal pause"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalReview(
  options: { goalId: string },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Get controller from container
    const controller = container.reviewGoalController;

    // 2. Create request
    const request: ReviewGoalRequest = {
      goalId: options.goalId,
    };

    // 3. Handle request
    const response = await controller.handle(request);

    // 4. Render review context with QA criteria
    renderReviewContext(renderer, response);
    renderer.divider();

  } catch (error) {
    renderer.error("Failed to submit goal for review", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}

/**
 * Render the review context with QA criteria for verification
 */
function renderReviewContext(
  renderer: Renderer,
  response: ReviewGoalResponse
) {
  const criteria = response.criteria;
  const goal = criteria.goal;

  // Header
  // Goal Implementation Instructions
  renderer.headline("\n" + "# Goal Review Instructions");
  renderer.info("You are the quality assurance specialist tasked with reviewing the goal (outlined below) implementation. The implementation MUST NOT HAVE DEVIATED from the instructions.");
  renderer.info("Your (the specialist's) skills are that of the perfect software engineer - the amalgamation of Robert C. Martin, Martin Fowler, and Eric Evans.");
  renderer.info("You expect perfect, efficient, secure, and well-documented code.");
  renderer.info("You are now in QA mode. Verify the implementation against the details below.");
  renderer.info("Report and fix any failures.");

  renderer.divider();

  // Objective
  renderer.headline("## Objective:");
  renderer.info("'" + goal.objective + "'");
  renderer.headline("## Success Criteria:");
  goal.successCriteria.forEach((criteria, index) => {
    renderer.info(`- ${criteria}`);
  });
  renderer.info("\n" + "VERIFY: Does the implementation succeed in fulfilling the objective and these specific criteria and adhere to the instructions below?");
  renderer.info("INSTRUCTION: If ANY criteria are NOT met, then report the issues, fix them, and re-run 'jumbo goal review --goal-id " + response.goalId + "' again.");

  if(isScoped(response)){
    renderer.headline("### Scope & Boundaries:");
    
    if(goal.filesToBeCreated && goal.filesToBeCreated.length > 0){
      renderer.headline("#### Files to be Created");
      goal.filesToBeCreated.forEach((file) => {
        renderer.info(`- ${file}`);
      });
      renderer.info("\n" + "VERIFY: These files were created.");
      renderer.info("INSTRUCTION: If any files are missing, then create them and re-run 'jumbo goal review --goal-id " + response.goalId + "' again.");
    }

    if(goal.filesToBeChanged && goal.filesToBeChanged.length > 0){
      renderer.headline("#### Files to be Changed");
      goal.filesToBeChanged.forEach((file) => {
        renderer.info(`- ${file}`);
      });
      renderer.info("\n" + "VERIFY: These files were changed.");
      renderer.info("INSTRUCTION: If any files are missing or not changed as expected, then update them and re-run 'jumbo goal review --goal-id " + response.goalId + "' again.");
    }

    if(goal.scopeIn && goal.scopeIn.length > 0){
      renderer.headline("#### In Scope");
      goal.scopeIn.forEach((item) => {
        renderer.info(`- ${item}`);
      });
      renderer.info("\n" + "VERIFY: The implementation stayed within the defined scope.");
      renderer.info("INSTRUCTION: If any work was done outside the defined scope, then adjust the implementation and re-run 'jumbo goal review --goal-id " + response.goalId + "' again.");
    }

    if(goal.scopeOut && goal.scopeOut.length > 0){
      renderer.headline("#### Out of Scope");
      goal.scopeOut.forEach((item) => {
        renderer.info(`- ${item}`);
      });
      renderer.info("\n" + "VERIFY: The implementation did not overlap these items.");
      renderer.info("INSTRUCTION: If any work overlapped these items, then adjust the implementation and re-run 'jumbo goal review --goal-id " + response.goalId + "' again.");
    }

    if(goal.boundaries && goal.boundaries.length > 0){
      goal.boundaries.forEach((boundary) => {
        renderer.info(`- ${boundary}`);
      });
      renderer.info("\n" + "VERIFY: The implementation did not exceed the following boundaries for this goal.");
      renderer.info("INSTRUCTION: If any boundaries were exceeded, then adjust the implementation and re-run 'jumbo goal review --goal-id " + response.goalId + "' again.");
    }
  }

  // Existing architecture - must be preserved
  if(criteria.architecture){
    renderer.headline("### Solution Architecture:");
    renderer.info("High-level Description: " + criteria.architecture!.description + "\n");
    renderer.info("Organization Style: " + criteria.architecture!.organization + "\n");
    renderer.info("\n" + "VERIFY: Namespaces (directory structures) and file names introduced by you (the developer) maintain the solution's architectural organization style.");
    renderer.info("INSTRUCTION: If any namespaces or file names do not maintain the solution's architectural organization style, then adjust them and re-run 'jumbo goal review --goal-id " + response.goalId + "' again.");
    
    if(criteria.architecture!.patterns && criteria.architecture!.patterns.length > 0){
      renderer.headline("#### Design Patterns:");
      criteria.architecture!.patterns.forEach((pattern) => {
        renderer.info(`- ${pattern}`);
      });
      renderer.info("\n" + "VERIFY: You (the developer) leveraged these architectural patterns where applicable.");
      renderer.info("If the goal does not fit a prescribed pattern, then did you register the new architecture pattern with jumbo. Run 'jumbo architecture update --help' for further instructions.");
      renderer.info("New patterns MUST not conflict with existing patterns. For example, if the solution uses a layered architecture pattern, then you MUST NOT introduce a microservices pattern.");
      renderer.info("INSTRUCTION: If any architectural patterns were not leveraged or new patterns conflict with existing ones, then adjust the implementation and re-run 'jumbo goal review --goal-id " + response.goalId + "' again.");
    }

    if(criteria.architecture!.principles && criteria.architecture!.principles.length > 0){
      renderer.headline("#### Principles:");
      criteria.architecture!.principles.forEach((principle) => {
        renderer.info(`- ${principle}`);
      });
      renderer.info("\n" + "VERIFY: Artifacts created by you (the developer) directly reflect these principles.");
      renderer.info("INSTRUCTION: If any artifacts do not reflect these principles, then adjust the implementation and re-run 'jumbo goal review --goal-id " + response.goalId + "' again.");
    }
  }

  if (criteria.components.length > 0) {
    renderer.headline("## Relevant Components:");
    criteria.components.forEach((c) => {
      renderer.info(`- ${c.name}: ${c.description}`);
    });
    renderer.info("\n" + "VERIFY: These components were considered in the implementation.");
    renderer.info("INSTRUCTION: If any components were not considered, then adjust the implementation and re-run 'jumbo goal review --goal-id " + response.goalId + "' again.");
  }

  if (criteria.dependencies.length > 0) {
    renderer.headline("## Relevant Dependencies:");
    criteria.dependencies.forEach((d) => {
      renderer.info(`- ${d.name} (v${d.version}): ${d.purpose}`);
    });
    renderer.info("\n" + "VERIFY: These dependencies are considered in the implementation.");
    renderer.info("INSTRUCTION: If any dependencies were not considered, then adjust the implementation and re-run 'jumbo goal review --goal-id " + response.goalId + "' again.");
  }

  if (criteria.decisions.length > 0) {
    renderer.headline("## Relevant Decisions:");
    criteria.decisions.forEach((d) => {
      renderer.info(`- ${d.title}: ${d.rationale}`);
    });
    renderer.info("\n" + "NOTE: The solution may contain artifacts that reflect previous design decisions.");
    renderer.info("VERIFY:These design decisions are reflected in the implementation and ensure the trajectory of the solution is consistent.");
    renderer.info("INSTRUCTION: If any design decisions are not reflected or the trajectory is inconsistent, then adjust the implementation and re-run 'jumbo goal review --goal-id " + response.goalId + "' again.");
  }

  if (criteria.invariants.length > 0) {
    renderer.headline("## Invariants:");
    criteria.invariants.forEach((inv) => {
      renderer.info(`- ${inv.category}:`);
      renderer.info(`  - ${inv.description}`);
    });
    renderer.info("\n" + "VERIFY: The implementation adheres to ALL of these invariants.");
    renderer.info("INSTRUCTION: If the implementation does not adhere to any of these invariants, then adjust the implementation and re-run 'jumbo goal review --goal-id " + response.goalId + "' again.");
  }

  if (criteria.guidelines.length > 0) {
    renderer.headline("## Guidelines:");
    criteria.guidelines.forEach((g) => {
      renderer.info(`- ${g.category}: ${g.description}`);
    });
    renderer.info("\n" + "VERIFY: The implementation follows these guidelines.");
    renderer.info("INSTRUCTION: If the implementation does not follow any of these guidelines, then adjust the implementation and re-run 'jumbo goal review --goal-id " + response.goalId + "' again.");
  }
 
  // Final instructions
  renderer.divider();
  renderer.headline("## Next Steps");
  renderer.info("If ALL criteria are met:");
  renderer.info(`  Run: jumbo goal qualify --goal-id ${response.goalId}`);
  renderer.info("\nIf ANY criteria are NOT met:");
  renderer.info("  Fix the issues and run: jumbo goal review --goal-id " + response.goalId + " again");
  renderer.info("---\n");
}

function isScoped(response: ReviewGoalResponse): boolean {
  return (
    (Array.isArray(response.criteria.goal.scopeIn) && response.criteria.goal.scopeIn.length > 0) ||
    (Array.isArray(response.criteria.goal.scopeOut) && response.criteria.goal.scopeOut.length > 0) ||
    (Array.isArray(response.criteria.goal.boundaries) && response.criteria.goal.boundaries.length > 0) ||
    (Array.isArray(response.criteria.goal.filesToBeCreated) && response.criteria.goal.filesToBeCreated.length > 0) ||
    (Array.isArray(response.criteria.goal.filesToBeChanged) && response.criteria.goal.filesToBeChanged.length > 0)
  );
}
