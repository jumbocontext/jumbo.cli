import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

const pollingRunMock = jest.fn(async ({ processOptions }) => {
  processOptions.emit({
    daemon: "reviewer",
    status: "idle",
    source: "reviewer",
    category: "waiting",
    message: "awaiting submitted goals",
  });
});
const buildMock = jest.fn();
const createBuilderMock = jest.fn(() => ({ build: buildMock }));
const hostMock = jest.fn(() => ({ createBuilder: createBuilderMock }));
const findNearestMock = jest.fn();

jest.unstable_mockModule("../../../src/application/daemons/PollingLoop.js", () => ({
  PollingLoop: jest.fn(() => ({ run: pollingRunMock })),
}));
jest.unstable_mockModule("../../../src/infrastructure/context/project/ProjectRootResolver.js", () => ({
  ProjectRootResolver: jest.fn(() => ({ findNearest: findNearestMock })),
}));
jest.unstable_mockModule("../../../src/infrastructure/host/Host.js", () => ({
  Host: hostMock,
}));

const { runReviewerDaemon } = await import("../../../src/presentation/work/reviewer.daemon.js");

describe("reviewer.daemon", () => {
  let stdoutSpy: jest.SpyInstance;

  beforeEach(() => {
    findNearestMock.mockReturnValue("C:\\project");
    buildMock.mockResolvedValue({
      goalStatusReader: {},
      goalContextReader: {},
      goalClaimPolicy: {},
      workerIdentityReader: {},
      reviewGoalController: {},
      telemetryClient: {},
    });
    stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
  });

  it("delegates to PollingLoop from a valid project root", async () => {
    await runReviewerDaemon(["node", "reviewer.daemon.js", "--agent", "codex"]);

    expect(hostMock).toHaveBeenCalledWith("C:\\project\\.jumbo");
    expect(pollingRunMock).toHaveBeenCalledWith(expect.objectContaining({
      processOptions: expect.objectContaining({ agentId: "codex" }),
    }));
    expect(stdoutSpy).toHaveBeenCalledWith("{\"daemon\":\"reviewer\",\"status\":\"idle\",\"source\":\"reviewer\",\"category\":\"waiting\",\"message\":\"awaiting submitted goals\"}\n");
  });
});
