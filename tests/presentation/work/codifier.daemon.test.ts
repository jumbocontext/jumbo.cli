import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

const processNextMock = jest.fn();
const pollingRunMock = jest.fn(async ({ processOptions }) => {
  processOptions.emit({
    daemon: "codifier",
    status: "idle",
    source: "codifier",
    category: "waiting",
    message: "awaiting approved goals",
  });
});
const buildMock = jest.fn();
const createBuilderMock = jest.fn(() => ({ build: buildMock }));
const hostMock = jest.fn(() => ({ createBuilder: createBuilderMock }));
const findNearestMock = jest.fn();
const projectRootResolverMock = jest.fn(() => ({ findNearest: findNearestMock }));
const agentCliGatewayMock = jest.fn();
const codifierProcessManagerMock = jest.fn(() => ({ processNext: processNextMock }));
const intervalTickerMock = jest.fn(function (this: { intervalMs: number }, intervalMs: number) {
  this.intervalMs = intervalMs;
});
const processSignalSourceMock = jest.fn(function (
  this: { isShutdownRequested: boolean; onShutdown: jest.Mock },
) {
  this.isShutdownRequested = false;
  this.onShutdown = jest.fn();
});

jest.unstable_mockModule("../../../src/application/daemons/PollingLoop.js", () => ({
  PollingLoop: jest.fn(() => ({ run: pollingRunMock })),
}));

jest.unstable_mockModule("../../../src/infrastructure/daemons/IntervalTicker.js", () => ({
  IntervalTicker: intervalTickerMock,
}));

jest.unstable_mockModule("../../../src/infrastructure/daemons/ProcessSignalSource.js", () => ({
  ProcessSignalSource: processSignalSourceMock,
}));

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
  CodifierProcessManager: codifierProcessManagerMock,
}));

const { runCodifierDaemon } = await import("../../../src/presentation/work/codifier.daemon.js");

describe("codifier.daemon", () => {
  const originalExit = process.exit;
  const originalExitCode = process.exitCode;
  let stderrSpy: jest.SpyInstance;
  let stdoutSpy: jest.SpyInstance;

  beforeEach(() => {
    processNextMock.mockReset();
    pollingRunMock.mockClear();
    buildMock.mockReset();
    createBuilderMock.mockClear();
    hostMock.mockClear();
    findNearestMock.mockReset();
    projectRootResolverMock.mockClear();
    agentCliGatewayMock.mockClear();
    codifierProcessManagerMock.mockClear();
    intervalTickerMock.mockClear();
    processSignalSourceMock.mockClear();
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
  });

  afterEach(() => {
    process.exit = originalExit;
    process.exitCode = originalExitCode;
    stderrSpy.mockRestore();
    stdoutSpy.mockRestore();
  });

  it("delegates to PollingLoop from a valid project root and emits daemon events", async () => {
    findNearestMock.mockReturnValue("C:\\project");

    await runCodifierDaemon([
      "node",
      "codifier.daemon.js",
      "--agent",
      "codex",
      "--max-retries",
      "2",
      "--poll-interval-ms",
      "5000",
    ]);

    expect(hostMock).toHaveBeenCalledWith("C:\\project\\.jumbo");
    expect(buildMock).toHaveBeenCalled();
    expect(pollingRunMock).toHaveBeenCalledWith(expect.objectContaining({
      processManager: expect.objectContaining({ processNext: processNextMock }),
      processOptions: expect.objectContaining({
        agentId: "codex",
        maxRetries: 2,
        emit: expect.any(Function),
      }),
      ticker: expect.objectContaining({ intervalMs: 5000 }),
      shutdownSignal: expect.objectContaining({ isShutdownRequested: false }),
    }));
    expect(intervalTickerMock).toHaveBeenCalledWith(5000);
    expect(processSignalSourceMock).toHaveBeenCalled();
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

  it("does not treat exhausted work as a daemon process failure", async () => {
    findNearestMock.mockReturnValue("C:\\project");
    pollingRunMock.mockImplementationOnce(async ({ processOptions }) => {
      processOptions.emit({
        daemon: "codifier",
        status: "exhausted",
        source: "codifier",
        category: "exhausted",
        message: "codification attempts exhausted",
        goalId: "goal_1",
        attempt: 3,
        maxRetries: 3,
      });
    });

    await runCodifierDaemon(["node", "codifier.daemon.js"]);

    expect(process.exitCode).toBeUndefined();
    expect(stdoutSpy).toHaveBeenCalledWith("{\"daemon\":\"codifier\",\"status\":\"exhausted\",\"source\":\"codifier\",\"category\":\"exhausted\",\"message\":\"codification attempts exhausted\",\"goalId\":\"goal_1\",\"attempt\":3,\"maxRetries\":3}\n");
  });
});
