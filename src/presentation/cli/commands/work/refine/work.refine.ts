/**
 * CLI Command: jumbo work refine
 *
 * Long-running daemon that continuously polls for goals in 'defined' state
 * and delegates their refinement to an agent subprocess. Runs until killed.
 *
 * Every interaction with Jumbo state is a short-lived subprocess.
 * This command holds no database connections or application infrastructure.
 */

import { execSync, spawn } from "node:child_process";
import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { RefineryDisplay } from "./RefineryDisplay.js";

const SUPPORTED_AGENTS = ["claude", "gemini", "copilot", "codex", "cursor", "vibe"] as const;
type AgentId = typeof SUPPORTED_AGENTS[number];

const AGENT_COMMANDS: Record<AgentId, { executable: string; promptFlag: string }> = {
  claude:  { executable: "claude",     promptFlag: "-p" },
  gemini:  { executable: "gemini",     promptFlag: "-p" },
  copilot: { executable: "gh copilot", promptFlag: "-p" },
  codex:   { executable: "codex",      promptFlag: "-p" },
  cursor:  { executable: "cursor",     promptFlag: "-p" },
  vibe:    { executable: "vibe",       promptFlag: "-p" },
};

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
};

interface WorkRefineOptions {
  readonly agent: string;
  readonly pollInterval?: string;
  readonly maxRetries?: string;
}

// --- Subprocess helpers ---

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

function queryGoalStatus(goalId: string): string {
  try {
    const stdout = execSync(`npx jumbo goal show --id ${goalId}`, {
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 30_000,
    }).toString();
    const parsed = JSON.parse(stdout);
    return parsed.status ?? parsed.goal?.status ?? "unknown";
  } catch {
    return "unknown";
  }
}

function spawnAgent(agentId: AgentId, goalId: string): Promise<number> {
  const { executable, promptFlag } = AGENT_COMMANDS[agentId];
  const prompt = `Run the Jumbo refinement workflow for goal ${goalId}. Execute: jumbo goal refine --id ${goalId}`;
  const escaped = prompt.replace(/"/g, '\\"');
  const command = `${executable} ${promptFlag} "${escaped}"`;

  return new Promise((resolve) => {
    const child = spawn(command, [], {
      stdio: ["ignore", "ignore", "ignore"],
      shell: true,
    });

    child.on("close", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}

// --- Main daemon loop ---

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

  const pollIntervalMs = (parseInt(options.pollInterval ?? "", 10) || DEFAULT_POLL_INTERVAL_S) * 1000;
  const maxRetries = parseInt(options.maxRetries ?? "", 10) || DEFAULT_MAX_RETRIES;
  const exhaustedGoals = new Set<string>();

  const display = new RefineryDisplay({
    agentId,
    pollIntervalS: pollIntervalMs / 1000,
    maxRetries,
  });

  let running = true;

  const shutdown = () => {
    running = false;
  };

  // Listen for 'q' keypress to stop gracefully
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", (key: Buffer) => {
      const ch = key.toString();
      if (ch === "q" || ch === "Q" || ch === "\x03") {
        shutdown();
      }
    });
  }
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await display.renderHeader();

  while (running) {
    const goals = queryDefinedGoals().filter(g => !exhaustedGoals.has(g.goalId));

    if (goals.length === 0) {
      const spinner = display.startWaiting();
      const end = Date.now() + pollIntervalMs;
      while (running && Date.now() < end) {
        await sleep(250);
      }
      spinner.stop();
      continue;
    }

    const target = goals[0];

    let refined = false;
    for (let attempt = 1; attempt <= maxRetries && running; attempt++) {
      display.renderGoalStart(target.goalId, target.objective, attempt, maxRetries);

      const spinner = display.startRefining();
      await spawnAgent(agentId, target.goalId);
      spinner.stop();

      if (!running) break;

      const status = queryGoalStatus(target.goalId);

      if (status === "refined") {
        display.renderGoalComplete(target.goalId, target.objective, attempt);
        refined = true;
        break;
      }

      if (attempt === maxRetries) {
        display.renderGoalSkipped(target.goalId, status, maxRetries);
      }
    }

    if (!refined) {
      exhaustedGoals.add(target.goalId);
    }

    await sleep(2000);
  }

  // Clean up stdin and exit
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
    process.stdin.pause();
  }
  display.renderShutdown();
}
