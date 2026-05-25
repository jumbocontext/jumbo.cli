import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { EventEmitter } from "node:events";
import { Readable } from "node:stream";

const spawnMock = jest.fn();

jest.unstable_mockModule("node:child_process", () => ({
  spawn: spawnMock,
}));

const { AgentCliGateway } = await import("../../../src/infrastructure/agents/AgentCliGateway.js");

function childProcess(): EventEmitter & { stdout: Readable; stderr: Readable } {
  const child = new EventEmitter() as EventEmitter & { stdout: Readable; stderr: Readable };
  child.stdout = new Readable({ read() {} });
  child.stderr = new Readable({ read() {} });
  return child;
}

describe("AgentCliGateway", () => {
  let telemetryClient: { track: jest.Mock; flush: jest.Mock; shutdown: jest.Mock };
  let stderrSpy: jest.SpyInstance;

  beforeEach(() => {
    spawnMock.mockReset();
    stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
    telemetryClient = {
      track: jest.fn(),
      flush: jest.fn(),
      shutdown: jest.fn(),
    };
  });

  afterEach(() => {
    stderrSpy.mockRestore();
  });

  it("spawns codex exec with the repository trust check bypassed for daemon automation", async () => {
    const child = childProcess();
    spawnMock.mockReturnValue(child);

    const promise = new AgentCliGateway(telemetryClient).invoke({
      agentId: "codex",
      prompt: "run codify",
    });
    child.emit("close", 0);

    await expect(promise).resolves.toEqual({ exitCode: 0, stdout: "", stderr: "" });
    expect(spawnMock).toHaveBeenCalledWith('codex exec --skip-git-repo-check "run codify"', [], {
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    });
    expect(telemetryClient.track).toHaveBeenCalledWith(
      "agent_invocation_completed",
      expect.objectContaining({ agentId: "codex", exitCode: 0, success: true }),
    );
  });

  it("keeps refinement prompts containing flags, spaces, and quotes inside the quoted prompt payload", async () => {
    const child = childProcess();
    spawnMock.mockReturnValue(child);
    const prompt = 'Run the Jumbo refinement workflow for goal goal_1. Execute: jumbo goal refine --id goal_1 --note "quoted value"';

    const promise = new AgentCliGateway(telemetryClient).invoke({
      agentId: "claude",
      prompt,
    });
    child.emit("close", 0);

    await expect(promise).resolves.toEqual({ exitCode: 0, stdout: "", stderr: "" });
    expect(spawnMock).toHaveBeenCalledWith(
      'claude -p "Run the Jumbo refinement workflow for goal goal_1. Execute: jumbo goal refine --id goal_1 --note \\"quoted value\\""',
      [],
      expect.objectContaining({ shell: true }),
    );
  });

  it("uses the same command-with-space mapping as the working legacy copilot command", async () => {
    const child = childProcess();
    spawnMock.mockReturnValue(child);

    const promise = new AgentCliGateway(telemetryClient).invoke({
      agentId: "copilot",
      prompt: "run review",
    });
    child.emit("close", 0);

    await expect(promise).resolves.toEqual({ exitCode: 0, stdout: "", stderr: "" });
    expect(spawnMock).toHaveBeenCalledWith(
      'gh copilot -p "run review"',
      [],
      expect.objectContaining({ shell: true }),
    );
  });

  it("captures and forwards agent stderr so failed daemon events can show the actual agent error", async () => {
    const child = childProcess();
    spawnMock.mockReturnValue(child);

    const promise = new AgentCliGateway(telemetryClient).invoke({
      agentId: "codex",
      prompt: "run codify",
    });
    child.stderr.emit("data", Buffer.from("codex failed\n"));
    child.emit("close", 1);

    await expect(promise).resolves.toEqual({ exitCode: 1, stdout: "", stderr: "codex failed\n" });
    expect(stderrSpy).toHaveBeenCalledWith("codex failed\n");
  });

  it("returns a failed invocation result when the child process errors", async () => {
    const child = childProcess();
    spawnMock.mockReturnValue(child);

    const promise = new AgentCliGateway(telemetryClient).invoke({
      agentId: "codex",
      prompt: "run codify",
    });
    child.emit("error", new Error("spawn failed"));

    await expect(promise).resolves.toEqual({ exitCode: 1, stdout: "", stderr: "spawn failed" });
    expect(telemetryClient.track).toHaveBeenCalledWith(
      "agent_invocation_completed",
      expect.objectContaining({
        agentId: "codex",
        exitCode: 1,
        success: false,
        errorType: "Error",
        errorMessage: "spawn failed",
      }),
    );
  });

  it("rejects unsupported agents before spawning", async () => {
    await expect(
      new AgentCliGateway(telemetryClient).invoke({
        agentId: "unknown",
        prompt: "run codify",
      }),
    ).rejects.toThrow("Unsupported agent: unknown");
    expect(spawnMock).not.toHaveBeenCalled();
  });
});
