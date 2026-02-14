import { SessionSummaryProjection } from "../../../../../application/context/sessions/SessionSummaryView.js";
import { GoalView } from "../../../../../application/context/goals/GoalView.js";
import { SessionStartContext, SessionStartProjectContext } from "../../../../../application/context/sessions/get-context/SessionStartContext.js";
import { YamlFormatter } from "../../../formatting/YamlFormatter.js";

export interface SessionStartTextRenderResult {
  readonly blocks: string[];
  readonly llmInstruction: string;
}

export interface SessionStartStructuredContext {
  readonly projectContext: Record<string, unknown> | null;
  readonly sessionContext: Record<string, unknown>;
  readonly inProgressGoals: Record<string, unknown>;
  readonly plannedGoals: Record<string, unknown>;
  readonly llmInstructions: {
    readonly sessionContext: string | null;
    readonly goalStart: string;
  };
}

/**
 * SessionStartTextRenderer - Formats session start context for LLM orientation
 *
 * Renders the session start context:
 * - Project name and purpose
 * - Target audiences
 * - Active audience pains
 * - Historical session context
 * - In-progress goals
 * - Planned goals
 *
 * Output Format: YAML (more LLM-friendly than JSON)
 */
export class SessionStartTextRenderer {
  private readonly yamlFormatter: YamlFormatter;

  constructor() {
    this.yamlFormatter = new YamlFormatter();
  }

  render(context: SessionStartContext): SessionStartTextRenderResult {
    const blocks: string[] = [];

    const projectContextYaml = this.renderProjectContext(context.projectContext);
    if (projectContextYaml) {
      blocks.push(projectContextYaml);
    }

    blocks.push(
      this.renderSessionSummary(
        context.latestSessionSummary,
        context.hasSolutionContext
      )
    );

    blocks.push(this.renderInProgressGoals(context.inProgressGoals));
    blocks.push(this.renderPlannedGoals(context.plannedGoals));

    return {
      blocks,
      llmInstruction: this.renderGoalStartInstruction(),
    };
  }

  buildStructuredContext(context: SessionStartContext): SessionStartStructuredContext {
    const sessionContextResult = this.buildSessionContextData(
      context.latestSessionSummary,
      context.hasSolutionContext
    );

    return {
      projectContext: this.buildProjectContextData(context.projectContext),
      sessionContext: sessionContextResult.data.sessionContext as Record<string, unknown>,
      inProgressGoals: this.buildInProgressGoalsData(context.inProgressGoals),
      plannedGoals: this.buildPlannedGoalsData(context.plannedGoals),
      llmInstructions: {
        sessionContext: sessionContextResult.llmInstruction ?? null,
        goalStart: this.renderGoalStartInstruction(),
      },
    };
  }

  renderSessionSummary(
    summary: SessionSummaryProjection | null,
    hasSolutionContext: boolean
  ): string {
    const sessionContextResult = this.buildSessionContextData(summary, hasSolutionContext);

    let output = this.yamlFormatter.toYaml(sessionContextResult.data);

    if (sessionContextResult.llmInstruction) {
      output += sessionContextResult.llmInstruction;
    }

    return output;
  }

  private renderProjectContext(
    projectContext: SessionStartProjectContext | null
  ): string {
    const contextData = this.buildProjectContextData(projectContext);

    if (!contextData) {
      return "";
    }

    return this.yamlFormatter.toYaml({ projectContext: contextData });
  }

  private renderInProgressGoals(goals: GoalView[]): string {
    const data = this.buildInProgressGoalsData(goals);

    return this.yamlFormatter.toYaml({ inProgressGoals: data });
  }

  private renderPlannedGoals(goals: GoalView[]): string {
    const data = this.buildPlannedGoalsData(goals);

    return this.yamlFormatter.toYaml({ plannedGoals: data });
  }

  private renderGoalStartInstruction(): string {
    const llmInstruction = [
      "@LLM: Prompt the user for input about what goal to start. ",
      "For example, \"I can see we've recently worked on X, Y, Z. ",
      "Everything was completed without blockers. Goals A, B, and N ",
      "are planned. Do you want to start with A, or something else?\"",
      "IMPORTANT: Run 'jumbo goal start --goal-id <id>' before doing any work!",
    ];

    return llmInstruction.join("\n");
  }

  /**
   * Format message when no session summary exists (first-ever session on brownfield project)
   *
   * Outputs direct LLM instructions that cause the agent to proactively offer
   * to help transfer existing project context into Jumbo.
   */
  private buildProjectContextData(
    projectContext: SessionStartProjectContext | null
  ): Record<string, unknown> | null {
    if (!projectContext) {
      return null;
    }

    const contextData: Record<string, unknown> = {
      name: projectContext.project.name,
      purpose: projectContext.project.purpose || "Not defined",
    };

    if (projectContext.audiences.length > 0) {
      contextData.audiences = projectContext.audiences.map((a) => ({
        name: a.name,
        description: a.description,
        priority: a.priority,
      }));
    }

    if (projectContext.audiencePains.length > 0) {
      contextData.audiencePains = projectContext.audiencePains.map((p) => ({
        title: p.title,
        description: p.description,
      }));
    }

    return contextData;
  }

  private buildInProgressGoalsData(goals: GoalView[]): Record<string, unknown> {
    if (goals.length === 0) {
      return {
        count: 0,
        message:
          "No goals currently in progress. Use 'jumbo goal start --goal-id <id>' to begin working on a goal.",
      };
    }

    return {
      count: goals.length,
      goals: goals.map((g) => ({
        goalId: g.goalId,
        objective: g.objective,
        status: g.status,
        createdAt: g.createdAt,
      })),
    };
  }

  private buildPlannedGoalsData(goals: GoalView[]): Record<string, unknown> {
    if (goals.length === 0) {
      return {
        count: 0,
        message:
          "No planned goals available. Use 'jumbo goal add' to create a new goal to work on.",
      };
    }

    return {
      count: goals.length,
      goals: goals.map((g) => ({
        goalId: g.goalId,
        objective: g.objective,
        status: g.status,
        createdAt: g.createdAt,
      })),
    };
  }

  private buildSessionContextData(
    summary: SessionSummaryProjection | null,
    hasSolutionContext: boolean
  ): { data: Record<string, unknown>; llmInstruction?: string } {
    if (!hasSolutionContext) {
      return {
        data: {
          sessionContext: {
            message:
              "No previous session context available. This appears to be your first session with Jumbo on this project.",
          },
        },
        llmInstruction: this.buildBrownfieldInstruction(),
      };
    }

    if (!summary) {
      return {
        data: {
          sessionContext: {
            message: "No previous session context available.",
          },
        },
      };
    }

    const contextData: any = {
      sessionContext: {
        focus: summary.focus,
        status: summary.status,
      },
    };

    if (summary.completedGoals.length > 0) {
      contextData.sessionContext.completedGoals = summary.completedGoals.map((g) => ({
        goalId: g.goalId,
        objective: g.objective,
        status: g.status,
        createdAt: g.createdAt,
      }));
    }

    if (summary.goalsStarted.length > 0) {
      contextData.sessionContext.goalsStarted = summary.goalsStarted.map((g) => ({
        goalId: g.goalId,
        objective: g.objective,
        startedAt: g.startedAt,
      }));
    }

    if (summary.goalsPaused.length > 0) {
      contextData.sessionContext.goalsPaused = summary.goalsPaused.map((g) => {
        const pausedGoal: any = {
          goalId: g.goalId,
          objective: g.objective,
          reason: g.reason,
          pausedAt: g.pausedAt,
        };
        if (g.note) {
          pausedGoal.note = g.note;
        }
        return pausedGoal;
      });
    }

    if (summary.goalsResumed.length > 0) {
      contextData.sessionContext.goalsResumed = summary.goalsResumed.map((g) => {
        const resumedGoal: any = {
          goalId: g.goalId,
          objective: g.objective,
          resumedAt: g.resumedAt,
        };
        if (g.note) {
          resumedGoal.note = g.note;
        }
        return resumedGoal;
      });
    }

    if (summary.blockersEncountered.length > 0) {
      contextData.sessionContext.blockersEncountered = summary.blockersEncountered.map((b) => ({
        goalId: b.goalId,
        reason: b.reason,
      }));
    }

    if (summary.decisions.length > 0) {
      contextData.sessionContext.decisions = summary.decisions.map((d) => ({
        decisionId: d.decisionId,
        title: d.title,
        rationale: d.rationale,
      }));
    }

    const llmInstruction =
      summary.goalsPaused.length > 0
        ? "\n\n@LLM: Goals were paused in this session. To resume a paused goal, run:\n  jumbo goal resume --goal-id <goal-id>"
        : undefined;

    return { data: contextData, llmInstruction };
  }

  private buildBrownfieldInstruction(): string {
    return [
      "",
      "@LLM: This is a BROWNFIELD PROJECT with no Jumbo context yet.",
      "",
      "REQUIRED ACTION: Proactively engage the user with the following approach:",
      "",
      "1. GREET and ACKNOWLEDGE: \"Hi! I can see that you've added Jumbo to this project. ",
      "   This looks like an existing codebase with valuable context to preserve.\"",
      "",
      "2. OFFER HELP: \"Would you like me to help transfer your existing project knowledge into Jumbo? ",
      "   I can scan your documentation, code structure, and patterns to capture:\"",
      "   - Project purpose and target audience (from README, docs)",
      "   - Architectural components and dependencies (from code structure)",
      "   - Development guidelines and coding standards (from patterns)",
      "   - Architectural decisions (from docs, comments, ADRs)",
      "",
      "3. GET PERMISSION: \"I'll ask for your confirmation before adding anything to Jumbo. ",
      "   Should we start by scanning your project documentation?\"",
      "",
      "IMPORTANT:",
      "- Take initiative: Don't wait passively. Actively offer to help.",
      "- Be conversational: Use natural language, not robotic instructions.",
      "- Human-in-the-loop: Always get user confirmation before running jumbo commands.",
      "- Start with docs: README.md, package.json, or docs/ are good starting points.",
      "",
      "AVAILABLE COMMANDS (use after getting user permission):",
      "- jumbo architecture define --help",
      "- jumbo component add --name 'ComponentName' --description 'What it does'",
      "- jumbo decision add --title 'Decision' --rationale 'Why' --context 'Background'",
      "- jumbo guideline add --category 'testing' --description 'Guideline text'",
      "- jumbo invariant add --category 'architecture' --description 'Non-negotiable rule'",
      "",
      "Run 'jumbo --help' to see all available commands.",
    ].join("\n");
  }
}
