/**
 * CLI Command: jumbo work review
 *
 * Long-running daemon that continuously polls for goals in 'submitted' state
 * and delegates their QA review to an agent subprocess. Runs until killed.
 *
 * A goal is considered reviewed when its status transitions to either
 * 'approved' or 'rejected' — both are valid review outcomes.
 *
 * Every interaction with Jumbo state is a short-lived subprocess.
 * This command holds no database connections or application infrastructure.
 */

import { execSync } from "node:child_process";
import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { ReviewerDisplay } from "./ReviewerDisplay.js";
import { SUPPORTED_AGENTS, AgentId, spawnAgent } from "../shared/AgentSpawner.js";
import { queryGoalStatus } from "../shared/GoalStatusQuery.js";
import { runDaemonLoop } from "../shared/DaemonLoop.js";

const DEFAULT_POLL_INTERVAL_S = 30;
const DEFAULT_MAX_RETRIES = 3;

const REVIEW_COMPLETE_STATUSES = ["approved", "rejected"] as const;

export const metadata: CommandMetadata = {
  description: "Continuously review submitted goals via an agent subprocess (runs until killed)",
  category: "work",
  requiredOptions: [
    {
      flags: "--agent <agentId>",
      description: `Agent to delegate review to (${SUPPORTED_AGENTS.join(", ")})`,
    },
  ],
  options: [
    {
      flags: "--poll-interval <seconds>",
      description: "Seconds to wait between polling for new goals",
      default: DEFAULT_POLL_INTERVAL_S,
    },
    {
      flags: "--max-retries <number>",
      description: "Max retry attempts per goal before moving on",
      default: DEFAULT_MAX_RETRIES,
    },
  ],
  examples: [
    {
      command: "jumbo work review --agent claude",
      description: "Start the reviewer daemon using Claude",
    },
    {
      command: "jumbo work review --agent claude --poll-interval 60",
      description: "Poll every 60 seconds instead of the default 30",
    },
  ],
  related: ["goal review", "goal approve", "goal reject", "work pause", "work resume"],
  requiresProject: true
};

interface WorkReviewOptions {
  readonly agent: string;
  readonly pollInterval?: string;
  readonly maxRetries?: string;
}

// --- Review-specific subprocess helpers ---

function querySubmittedGoals(): { goalId: string; objective: string; createdAt: string }[] {
  try {
    const stdout = execSync("npx jumbo goals list --status submitted", {
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 30_000,
    }).toString();
    const parsed = JSON.parse(stdout);
    const goals = (parsed.goals ?? []) as { goalId: string; objective: string; createdAt: string }[];
    return goals.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } catch {
    return [];
  }
}

function isReviewComplete(goalId: string): boolean {
  const status = queryGoalStatus(goalId);
  return (REVIEW_COMPLETE_STATUSES as readonly string[]).includes(status);
}

// --- Main daemon entry ---

export async function workReview(
  options: WorkReviewOptions,
  _container: IApplicationContainer,
) {
  const agentId = options.agent as AgentId;
  if (!SUPPORTED_AGENTS.includes(agentId)) {
    const display = new ReviewerDisplay({ agentId, pollIntervalS: 0, maxRetries: 0 });
    display.renderUnknownAgent(options.agent, SUPPORTED_AGENTS);
    process.exit(1);
  }

  const pollIntervalS = parseInt(options.pollInterval ?? "", 10) || DEFAULT_POLL_INTERVAL_S;
  const maxRetries = parseInt(options.maxRetries ?? "", 10) || DEFAULT_MAX_RETRIES;

  const display = new ReviewerDisplay({
    agentId,
    pollIntervalS,
    maxRetries,
  });

  await runDaemonLoop(
    { agentId, pollIntervalS, maxRetries },
    display,
    {
      queryGoals: () => querySubmittedGoals(),
      spawnAgent: (goalId) => {
        const prompt = `Run the Jumbo review workflow for goal ${goalId}. Execute: jumbo goal review --id ${goalId}`;
        return spawnAgent(agentId, prompt);
      },
      isGoalComplete: (goalId) => isReviewComplete(goalId),
      onGoalComplete: (goalId, objective, attempts) => {
        const outcome = queryGoalStatus(goalId);
        display.renderReviewOutcome(goalId, objective, attempts, outcome);
      },
      onGoalSkipped: (goalId, _status, retries) => {
        const status = queryGoalStatus(goalId);
        display.renderGoalSkipped(goalId, status, retries);
      },
    },
  );
}
