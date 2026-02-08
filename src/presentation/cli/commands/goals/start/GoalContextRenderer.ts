import { GoalContextView } from "../../../../../application/goals/get-context/GoalContextView.js";
import { YamlFormatter } from "../../../formatting/YamlFormatter.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * GoalContextRenderer - Renders goal context for LLM
 *
 * Renders focused, token-optimized context when starting a goal:
 * - Category 1: Work (Goal details)
 * - Category 2: Solution (Components, dependencies, decisions - filtered by scope)
 * - Category 3: Invariants & Boundaries
 * - Category 4: Execution Guidelines
 * - Category 5: Relations
 *
 * Output Format: Markdown with YAML blocks (LLM-friendly)
 *
 * Usage:
 *   const renderer = new GoalContextRenderer();
 *   const contextMarkdown = renderer.format(context);
 */
export class GoalContextRenderer {
  private readonly yamlFormatter: YamlFormatter;
  private readonly renderer: Renderer;


  constructor(renderer: Renderer) {
    this.yamlFormatter = new YamlFormatter();
    this.renderer = renderer;
  }

  /**
   * Render goal context as
   *
   * Prefers embedded context when available (from --interactive goal creation).
   * Falls back to queried context for legacy goals.
   *
   * @param context - GoalContextView to render
   * @returns YAML string with goal context
   */
  render(context: GoalContextView) {

    const renderer = this.renderer;
    const goal = context.goal;

    // Goal Implementation Instructions
    renderer.headline("\n" + "# Goal Implementation Instructions");
    renderer.info("You are the developer tasked with implementing the goal outlined below. DO NOT DEVIATE from the instructions.");
    renderer.info("You (the developer) are the perfect software engineer - the amalgamation of Robert C. Martin, Martin Fowler, and Eric Evans.");
    renderer.info("You write perfect, efficient, secure, and well-documented code.");

    // Objective
    renderer.headline("## Objective:");
    renderer.info("'" + goal.objective + "'");
    renderer.info("\n" + "INSTRUCTION: Your (the developer's) purpose for this goal is to fulfill this objective.");

    renderer.headline("## Success Criteria:");
    goal.successCriteria.forEach((criteria, index) => {
      renderer.info(`- ${criteria}`);
    });
    renderer.info("\n" + "INSTRUCTION: Your (the developer's) success in fulfilling the objective is measured by these specific criteria and adherence to the instructions below.");

    if(goal.progress && goal.progress.length > 0){
      renderer.headline("## Current Progress:");
      goal.progress.forEach((progressItem) => {
        renderer.info(`- ${progressItem}`);
      });
      renderer.info("\n" + "INSTRUCTION: Implementation of this goal has previously been started.");
      renderer.info("Review the current progress to understand what has already been accomplished and continue from there.");
    }

    if(this.isScoped(context)){

      renderer.headline("### Scope & Boundaries:");
      
      if(goal.filesToBeCreated && goal.filesToBeCreated.length > 0){
        renderer.headline("#### Files to be Created");
        goal.filesToBeCreated.forEach((file) => {
          renderer.info(`- ${file}`);
        });
        renderer.info("\n" + "INSTRUCTION: You (the developer) MUST create these files as part of this goal.");
      }

      if(goal.filesToBeChanged && goal.filesToBeChanged.length > 0){
        renderer.headline("#### Files to be Changed");
        goal.filesToBeChanged.forEach((file) => {
          renderer.info(`- ${file}`);
        });
        renderer.info("\n" + "INSTRUCTION: You (the developer) MUST change these files as part of this goal.");
      }

      if(goal.scopeIn && goal.scopeIn.length > 0){
        renderer.headline("#### In Scope");
        goal.scopeIn.forEach((item) => {
          renderer.info(`- ${item}`);
        });
        renderer.info("\n" + "INSTRUCTION: You (the developer) MUST work within the defined scope.");
      }

      if(goal.scopeOut && goal.scopeOut.length > 0){
        renderer.headline("#### Out of Scope");
        goal.scopeOut.forEach((item) => {
          renderer.info(`- ${item}`);
        });
        renderer.info("\n" + "INSTRUCTION: Your (the developer) work MUST NOT overlap these items.");
      }

      if(goal.boundaries && goal.boundaries.length > 0){
        goal.boundaries.forEach((boundary) => {
          renderer.info(`- ${boundary}`);
        });
        renderer.info("\n" + "INSTRUCTION: Your (the developer) work MUST NOT exceed the following boundaries for this goal:");
      }
    }

    if(context.architecture){
      renderer.headline("### Solution Architecture:");
      renderer.info("High-level Description: " + context.architecture!.description + "\n");
      renderer.info("Organization Style: " + context.architecture!.organization + "\n");
      renderer.info("\n" + "INSTRUCTION: Namespaces (directory structures) and file names introduced by you (the developer) MUST maintain the solution's architectural organization style.");
      
      if(context.architecture!.patterns && context.architecture!.patterns.length > 0){
        renderer.headline("#### Design Patterns:");
        context.architecture!.patterns.forEach((pattern) => {
          renderer.info(`- ${pattern}`);
        });
        renderer.info("\n" + "INSTRUCTION: You (the developer) MUST must leverage these architectural patterns where applicable.");
        renderer.info("If the goal does not fit a prescribed pattern, then you MUST register the new architecture pattern with jumbo. Run 'jumbo architecture update --help' for further instructions.");
        renderer.info("New patterns MUST not conflict with existing patterns. For example, if the solution uses a layered architecture pattern, then you MUST NOT introduce a microservices pattern.");
      }

      if(context.architecture!.principles && context.architecture!.principles.length > 0){
        renderer.headline("#### Principles:");
        context.architecture!.principles.forEach((principle) => {
          renderer.info(`- ${principle}`);
        });
        renderer.info("\n" + "INSTRUCTION: Artifacts created by you (the developer) MUST directly reflect these principles.");
      }
    }

    if (context.components.length > 0) {
      renderer.headline("## Relevant Components:");
      context.components.forEach((c) => {
        renderer.info(`- ${c.name}: ${c.description}`);
      });
      renderer.info("\n" + "INSTRUCTION: You (the developer) MUST consider these components while implementing this goal."); 
    }

    if (context.dependencies.length > 0) {
      renderer.headline("## Relevant Dependencies:");
      context.dependencies.forEach((d) => {
        renderer.info(`- ${d.name} (v${d.version}): ${d.purpose}`);
      });
      renderer.info("\n" + "INSTRUCTION: You (the developer) MUST consider the following dependencies while implementing this goal.");
    }

    if (context.decisions.length > 0) {
      renderer.headline("## Relevant Decisions:");
      context.decisions.forEach((d) => {
        renderer.info(`- ${d.title}: ${d.rationale}`);
      });
      renderer.info("\n" + "INSTRUCTION: The solution may contain artifacts that reflect previous design decisions.");
      renderer.info("Therefore, you MUST consider these design decisions while implementing this goal to ensure the trajectory of the solution remains consistent.");
    }

    if (context.invariants.length > 0) {
      renderer.headline("## Invariants:");
      context.invariants.forEach((inv) => {
        renderer.info(`- ${inv.category}:`);
        renderer.info(`  - ${inv.description}`);
      });
      renderer.info("\n" + "INSTRUCTION: You (the developer) MUST adhere to ALL of these invariants while implementing this goal.");
    }

    if (context.guidelines.length > 0) {
      renderer.headline("##Guidelines:");
      context.guidelines.forEach((g) => {
        renderer.info(`- ${g.category}: ${g.description}`);
      });
      renderer.info("\n" + "INSTRUCTION: You (the developer) SHOULD follow these guidelines while implementing this goal.");
    }

  }

  private isScoped(context: GoalContextView): boolean {
    return (
      (Array.isArray(context.goal.scopeIn) && context.goal.scopeIn.length > 0) ||
      (Array.isArray(context.goal.scopeOut) && context.goal.scopeOut.length > 0) ||
      (Array.isArray(context.goal.boundaries) && context.goal.boundaries.length > 0) ||
      (Array.isArray(context.goal.filesToBeCreated) && context.goal.filesToBeCreated.length > 0) ||
      (Array.isArray(context.goal.filesToBeChanged) && context.goal.filesToBeChanged.length > 0)
    );
  }
}
