import { spawn } from "node:child_process";
import { IAgentGateway } from "../../application/agents/IAgentGateway.js";
import { AgentInvocation, AgentInvocationResult } from "../../application/agents/AgentInvocation.js";
import { ITelemetryClient } from "../../application/telemetry/ITelemetryClient.js";

export const SUPPORTED_AGENT_IDS = ["claude", "gemini", "copilot", "codex", "cursor", "vibe"] as const;
export type SupportedAgentId = typeof SUPPORTED_AGENT_IDS[number];

interface AgentCommand {
  readonly executable: string;
  readonly args?: readonly string[];
  readonly promptFlag?: string;
}

const CODEX_NON_INTERACTIVE_EXEC_ARGS = ["exec", "--skip-git-repo-check"] as const;
const AGENT_OUTPUT_TAIL_MAX_LENGTH = 16_384;

const AGENT_COMMANDS: Record<SupportedAgentId, AgentCommand> = {
  claude: { executable: "claude", promptFlag: "-p" },
  gemini: { executable: "gemini", promptFlag: "-p" },
  copilot: { executable: "gh copilot", promptFlag: "-p" },
  codex: { executable: "codex", args: CODEX_NON_INTERACTIVE_EXEC_ARGS },
  cursor: { executable: "cursor", promptFlag: "-p" },
  vibe: { executable: "vibe", promptFlag: "-p" },
};

export class AgentCliGateway implements IAgentGateway {
  constructor(private readonly telemetryClient: ITelemetryClient) {}

  async invoke(invocation: AgentInvocation): Promise<AgentInvocationResult> {
    const startedAt = process.hrtime.bigint();
    const command = this.resolveCommand(invocation.agentId);
    const commandLine = this.buildCommandLine(command, invocation.prompt);

    return new Promise((resolve) => {
      const stdout = new BoundedTextTail(AGENT_OUTPUT_TAIL_MAX_LENGTH);
      const stderr = new BoundedTextTail(AGENT_OUTPUT_TAIL_MAX_LENGTH);
      const child = spawn(commandLine, [], {
        stdio: ["ignore", "pipe", "pipe"],
        shell: true,
      });

      child.stdout?.on("data", (chunk: Buffer) => {
        stdout.append(chunk.toString());
      });

      child.stderr?.on("data", (chunk: Buffer) => {
        stderr.append(chunk.toString());
      });

      child.on("close", (code) => {
        const exitCode = code ?? 1;
        this.trackInvocation(invocation.agentId, exitCode, startedAt);
        resolve({ exitCode, stdout: stdout.toString(), stderr: stderr.toString() });
      });

      child.on("error", (error) => {
        this.trackInvocation(invocation.agentId, 1, startedAt, error);
        resolve({
          exitCode: 1,
          stdout: stdout.toString(),
          stderr: stderr.toString() || limitTextTail(error.message, AGENT_OUTPUT_TAIL_MAX_LENGTH),
        });
      });
    });
  }

  private resolveCommand(agentId: string): AgentCommand {
    if (!this.isSupportedAgent(agentId)) {
      throw new Error(`Unsupported agent: ${agentId}`);
    }

    return AGENT_COMMANDS[agentId];
  }

  private buildCommandLine(command: AgentCommand, prompt: string): string {
    const escapedPrompt = prompt.replace(/"/g, '\\"');
    return [
      command.executable,
      ...(command.args ?? []),
      ...(command.promptFlag === undefined ? [] : [command.promptFlag]),
      `"${escapedPrompt}"`,
    ].join(" ");
  }

  private isSupportedAgent(agentId: string): agentId is SupportedAgentId {
    return (SUPPORTED_AGENT_IDS as readonly string[]).includes(agentId);
  }

  private trackInvocation(
    agentId: string,
    exitCode: number,
    startedAt: bigint,
    error?: Error,
  ): void {
    this.telemetryClient.track("agent_invocation_completed", {
      agentId,
      exitCode,
      success: exitCode === 0,
      durationMs: Number((process.hrtime.bigint() - startedAt) / BigInt(1_000_000)),
      ...(error
        ? {
            errorType: error.name,
            errorMessage: error.message,
            errorStack: error.stack,
          }
        : {}),
    });
  }
}

class BoundedTextTail {
  private value = "";

  constructor(private readonly maxLength: number) {}

  append(nextValue: string): void {
    if (nextValue.length >= this.maxLength) {
      this.value = limitTextTail(nextValue, this.maxLength);
      return;
    }

    this.value = limitTextTail(`${this.value}${nextValue}`, this.maxLength);
  }

  toString(): string {
    return this.value;
  }
}

function limitTextTail(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(-maxLength) : value;
}
