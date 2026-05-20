import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

const processNextMock = jest.fn();
const buildMock = jest.fn();
const createBuilderMock = jest.fn(() => ({ build: buildMock }));
const hostMock = jest.fn(() => ({ createBuilder: createBuilderMock }));
const findNearestMock = jest.fn();
const projectRootResolverMock = jest.fn(() => ({ findNearest: findNearestMock }));
const agentCliGatewayMock = jest.fn();

jest.unstable_mockModule("../../../src/infrastructure/host/Host.js", () => ({
  Host: hostMock,
}));

jest.unstable_mockModule("../../../src/infrastructure/context/project/ProjectRootResolver.js", () => ({
  ProjectRootResolver: projectRootResolverMock,
}));

jest.unstable_mockModule("../../../src/infrastructure/agents/AgentCliGateway.js", () => ({
  AgentCliGateway: agentCliGatewayMock,
}));

jest.unstable_mockModule("../../../src/application/context/goals/codify/CodifierProcessManager.js", () => ({
  CodifierProcessManager: jest.fn(() => ({ processNext: processNextMock })),
}));

const { runCodifierDaemon } = await import("../../../src/presentation/work/codifier.daemon.js");

describe("codifier.daemon", () => {
  const originalExit = process.exit;
  const originalExitCode = process.exitCode;
  let stderrSpy: jest.SpyInstance;
  let stdoutSpy: jest.SpyInstance;

  beforeEach(() => {
    processNextMock.mockReset();
    buildMock.mockReset();
    createBuilderMock.mockClear();
    hostMock.mockClear();
    findNearestMock.mockReset();
    projectRootResolverMock.mockClear();
    agentCliGatewayMock.mockClear();
    process.exitCode = undefined;
    stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
    stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    buildMock.mockResolvedValue({
      goalStatusReader: {},
      goalCodifyingStartedProjector: {},
      goalClaimPolicy: {},
      workerIdentityReader: {},
      codifyGoalController: {},
      telemetryClient: {},
    });
    processNextMock.mockImplementation(async ({ emit }) => {
      emit({
        daemon: "codifier",
        status: "idle",
        source: "codifier",
        category: "waiting",
        message: "awaiting approved goals",
      });
      return { status: "idle", attempts: 0 };
    });
  });

  afterEach(() => {
    process.exit = originalExit;
    process.exitCode = originalExitCode;
    stderrSpy.mockRestore();
    stdoutSpy.mockRestore();
  });

  it("builds infrastructure only after finding a project root and emits daemon events", async () => {
    findNearestMock.mockReturnValue("C:\\project");

    await runCodifierDaemon(["node", "codifier.daemon.js", "--agent", "codex", "--max-retries", "2"]);

    expect(hostMock).toHaveBeenCalledWith("C:\\project\\.jumbo");
    expect(buildMock).toHaveBeenCalled();
    expect(processNextMock).toHaveBeenCalledWith(expect.objectContaining({
      agentId: "codex",
      maxRetries: 2,
      emit: expect.any(Function),
    }));
    expect(stdoutSpy).toHaveBeenCalledWith("{\"daemon\":\"codifier\",\"status\":\"idle\",\"source\":\"codifier\",\"category\":\"waiting\",\"message\":\"awaiting approved goals\"}\n");
  });

  it("does not construct infrastructure outside a project root", async () => {
    findNearestMock.mockReturnValue(null);
    process.exit = jest.fn((() => {
      throw new Error("exit");
    }) as unknown as typeof process.exit);

    await expect(runCodifierDaemon(["node", "codifier.daemon.js"])).rejects.toThrow("exit");

    expect(stderrSpy).toHaveBeenCalledWith(
      "No Jumbo project was found at the current directory or any parent directory.\n",
    );
    expect(hostMock).not.toHaveBeenCalled();
  });

  it("sets failure exit code for exhausted work", async () => {
    findNearestMock.mockReturnValue("C:\\project");
    processNextMock.mockResolvedValue({ status: "exhausted", goalId: "goal_1", attempts: 3 });

    await runCodifierDaemon(["node", "codifier.daemon.js"]);

    expect(process.exitCode).toBe(1);
  });
});
