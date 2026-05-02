/**
 * CLI Command: jumbo work refine
 *
 * Long-running daemon that continuously polls for goals in 'defined' state
 * and delegates their refinement to an agent subprocess. Runs until killed.
 *
 * Every interaction with Jumbo state is a short-lived subprocess.
 * This command holds no database connections or application infrastructure.
 */

import { execSync } from "node:child_process";
import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { RefineryDisplay } from "./RefineryDisplay.js";
import { SUPPORTED_AGENTS, AgentId, spawnAgent } from "../shared/AgentSpawner.js";
import { queryGoalStatus } from "../shared/GoalStatusQuery.js";
import { runDaemonLoop } from "../shared/DaemonLoop.js";

const DEFAULT_POLL_INTERVAL_S = 30;
const DEFAULT_MAX_RETRIES = 3;

export const metadata: CommandMetadata = {
  description: "Continuously refine defined goals via an agent subprocess (runs until killed)",
  category: "work",
  requiredOptions: [
    {
      flags: "--agent <agentId>",
      description: `Agent to delegate refinement to (${SUPPORTED_AGENTS.join(", ")})`,
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
      command: "jumbo work refine --agent claude",
      description: "Start the refinery daemon using Claude",
    },
    {
      command: "jumbo work refine --agent claude --poll-interval 60",
      description: "Poll every 60 seconds instead of the default 30",
    },
  ],
  related: ["goal refine", "work pause", "work resume"],
  requiresProject: true
};

interface WorkRefineOptions {
  readonly agent: string;
  readonly pollInterval?: string;
  readonly maxRetries?: string;
}

// --- Refine-specific subprocess helpers ---

function queryDefinedGoals(): { goalId: string; objective: string; createdAt: string }[] {
  try {
    const stdout = execSync("npx jumbo goals list --status defined", {
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

// --- Main daemon entry ---

export async function workRefine(
  options: WorkRefineOptions,
  _container: IApplicationContainer
) {
  const agentId = options.agent as AgentId;
  if (!SUPPORTED_AGENTS.includes(agentId)) {
    const display = new RefineryDisplay({ agentId, pollIntervalS: 0, maxRetries: 0 });
    display.renderUnknownAgent(options.agent, SUPPORTED_AGENTS);
    process.exit(1);
  }

  const pollIntervalS = parseInt(options.pollInterval ?? "", 10) || DEFAULT_POLL_INTERVAL_S;
  const maxRetries = parseInt(options.maxRetries ?? "", 10) || DEFAULT_MAX_RETRIES;

  const display = new RefineryDisplay({
    agentId,
    pollIntervalS,
    maxRetries,
  });

  await runDaemonLoop(
    { agentId, pollIntervalS, maxRetries },
    display,
    {
      queryGoals: () => queryDefinedGoals(),
      spawnAgent: (goalId) => {
        const prompt = `Run the Jumbo refinement workflow for goal ${goalId}. Execute: jumbo goal refine --id ${goalId}`;
        return spawnAgent(agentId, prompt);
      },
      isGoalComplete: (goalId) => queryGoalStatus(goalId) === "refined",
      onGoalComplete: (goalId, objective, attempts) => {
        display.renderGoalComplete(goalId, objective, attempts);
      },
      onGoalSkipped: (goalId, _status, retries) => {
        const status = queryGoalStatus(goalId);
        display.renderGoalSkipped(goalId, status, retries);
      },
    },
  );
}
