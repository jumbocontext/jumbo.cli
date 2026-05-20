import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { TuiApp } from "../../../src/presentation/tui/TuiApp.js";
import type {
  ISubprocessManager,
  TuiDaemonName,
  TuiSubprocessSnapshot,
} from "../../../src/presentation/tui/subprocess/ISubprocessManager.js";
import type { AddGoalRequest } from "../../../src/application/context/goals/add/AddGoalRequest.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 50));
const waitForFrame = async (
  lastFrame: () => string | undefined,
  predicate: (frame: string) => boolean,
) => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    await tick();
    const frame = lastFrame() ?? "";
    if (predicate(frame)) {
      return frame;
    }
  }
  return lastFrame() ?? "";
};

describe("TuiApp", () => {
  const projectSummaryController = (
    lifecycleState: "uninitialized" | "unprimed" | "primed-empty" | "primed",
  ) => ({
    execute: async () => ({
      name: "Test Project",
      purpose: null,
      lifecycleState,
    }),
  });
  const failedDaemonSnapshot: TuiSubprocessSnapshot = {
    name: "reviewer",
    status: "failed",
    config: {
      agentId: "reviewer-agent",
      pollIntervalMs: 100,
      maxRetries: 1,
    },
    stdout: [],
    stderr: ["reviewer failed"],
    events: [],
    exitCode: 1,
    exitSignal: null,
  };
  const subprocessManagerWithFailedDaemon: ISubprocessManager = {
    spawn: async () => failedDaemonSnapshot,
    terminate: async () => failedDaemonSnapshot,
    terminateAll: async () => {},
    getStatus: (_name: TuiDaemonName) => failedDaemonSnapshot,
    getAllStatuses: () => [failedDaemonSnapshot],
  };

  it("renders a non-empty frame on mount", () => {
    const { lastFrame, unmount } = render(<TuiApp />);
    expect((lastFrame() ?? "").length).toBeGreaterThan(0);
    unmount();
  });

  it("changes frame when m is pressed (MegaMenu toggles open)", async () => {
    const { stdin, lastFrame, unmount } = render(<TuiApp />);
    const before = lastFrame();
    stdin.write("m");
    await tick();
    expect(lastFrame()).not.toBe(before);
    unmount();
  });

  it("MegaMenu closes on escape and returns to prior frame", async () => {
    const { stdin, lastFrame, unmount } = render(<TuiApp />);
    const initial = lastFrame();
    stdin.write("m");
    await tick();
    expect(lastFrame()).not.toBe(initial);
    stdin.write("\x1B");
    await tick();
    expect(lastFrame()).toContain("menu");
    expect(lastFrame()).not.toContain("Memory");
    expect(initial).toContain("menu");
    unmount();
  });

  it("q does not quit while MegaMenu is open", async () => {
    const { stdin, lastFrame, unmount } = render(<TuiApp />);
    stdin.write("m");
    await tick();
    expect(lastFrame()).toContain("Memory");
    stdin.write("q");
    await tick();
    expect(lastFrame()).toContain("Memory");
    unmount();
  });

  it("opens the init flow from the global shortcut when the project is uninitialized", async () => {
    const { stdin, lastFrame, unmount } = render(
      <TuiApp
        stateReaderControllers={{
          getProjectSummaryQueryHandler:
            projectSummaryController("uninitialized"),
        }}
      />,
    );

    await waitForFrame(lastFrame, (frame) => frame.includes("Test Project"));
    expect(lastFrame()).not.toContain("init");

    stdin.write("i");
    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Initialize Project"),
    );

    expect(lastFrame()).toContain("Initialize Project");
    unmount();
  });

  it("does not open the init flow from the global shortcut after initialization", async () => {
    const { stdin, lastFrame, unmount } = render(
      <TuiApp
        stateReaderControllers={{
          getProjectSummaryQueryHandler: projectSummaryController("primed"),
        }}
      />,
    );

    await waitForFrame(lastFrame, (frame) => frame.includes("Test Project"));
    expect(lastFrame()).not.toContain("init");

    stdin.write("i");
    await tick();

    expect(lastFrame()).not.toContain("Initialize Project");
    unmount();
  });

  it("shows the cockpit panel tab footer badge only on the primed cockpit launchpad", async () => {
    const { lastFrame, unmount } = render(
      <TuiApp
        stateReaderControllers={{
          getProjectSummaryQueryHandler: projectSummaryController("primed"),
        }}
      />,
    );

    await waitForFrame(lastFrame, (frame) => frame.includes("EVENTS//"));

    expect(lastFrame()).toContain(" tab ");
    expect(lastFrame()).toContain("panels");
    unmount();
  }, 10000);

  it("skips the unprimed cockpit screen for the current TUI session", async () => {
    const { stdin, lastFrame, unmount } = render(
      <TuiApp
        stateReaderControllers={{
          getProjectSummaryQueryHandler: projectSummaryController("unprimed"),
        }}
      />,
    );

    await waitForFrame(lastFrame, (frame) => frame.includes("Test Project"));
    stdin.write("s");
    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Project memory is stored."),
    );

    expect(lastFrame()).toContain("Ready to create your first goal.");
    expect(lastFrame()).not.toContain("This looks like an existing project.");
    unmount();
  }, 10000);

  it("opens goal authoring from the primed-empty cockpit shortcut", async () => {
    const { stdin, lastFrame, unmount } = render(
      <TuiApp
        stateReaderControllers={{
          getProjectSummaryQueryHandler:
            projectSummaryController("primed-empty"),
        }}
      />,
    );

    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Ready to create your first goal."),
    );

    stdin.write("g");
    await waitForFrame(lastFrame, (frame) => frame.includes("Author Goal"));

    expect(lastFrame()).toContain("Author Goal");
    expect(lastFrame()).toContain("Objective");
    unmount();
  }, 10000);

  it("does not open goal authoring from non-primed cockpit states", async () => {
    const { stdin, lastFrame, unmount } = render(
      <TuiApp
        stateReaderControllers={{
          getProjectSummaryQueryHandler: projectSummaryController("primed"),
        }}
      />,
    );

    await waitForFrame(lastFrame, (frame) => frame.includes("Test Project"));

    stdin.write("g");
    await tick();

    expect(lastFrame()).not.toContain("Author Goal");
    unmount();
  }, 10000);

  it("suppresses surrounding shortcuts while goal authoring is open", async () => {
    const { stdin, lastFrame, unmount } = render(
      <TuiApp
        stateReaderControllers={{
          getProjectSummaryQueryHandler:
            projectSummaryController("primed-empty"),
        }}
        subprocessManager={subprocessManagerWithFailedDaemon}
      />,
    );

    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Ready to create your first goal."),
    );
    stdin.write("G");
    await waitForFrame(lastFrame, (frame) => frame.includes("Author Goal"));

    stdin.write("m");
    await tick();
    stdin.write("n");
    await tick();

    expect(lastFrame()).toContain("Author Goal");
    expect(lastFrame()).not.toContain("Navigate");
    expect(lastFrame()).not.toContain("Notifications");
    unmount();
  }, 10000);

  it("returns to the primed-empty cockpit when goal authoring is cancelled", async () => {
    const { stdin, lastFrame, unmount } = render(
      <TuiApp
        stateReaderControllers={{
          getProjectSummaryQueryHandler:
            projectSummaryController("primed-empty"),
        }}
      />,
    );

    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Ready to create your first goal."),
    );
    stdin.write("g");
    await waitForFrame(lastFrame, (frame) => frame.includes("Author Goal"));

    stdin.write("\x1b");
    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Ready to create your first goal."),
    );

    expect(lastFrame()).not.toContain("Author Goal");
    expect(lastFrame()).toContain("Press");
    expect(lastFrame()).toContain("to add a goal");
    unmount();
  }, 10000);

  it("returns to the primed-empty cockpit when goal authoring completes", async () => {
    let lifecycleState: "primed-empty" | "primed" = "primed-empty";
    const addGoalRequests: AddGoalRequest[] = [];
    const { stdin, lastFrame, unmount } = render(
      <TuiApp
        stateReaderControllers={{
          getProjectSummaryQueryHandler: {
            execute: async () => ({
              name: "Test Project",
              purpose: null,
              lifecycleState,
            }),
          },
        }}
        actionControllers={{
          addGoalController: {
            handle: async (request: AddGoalRequest) => {
              addGoalRequests.push(request);
              lifecycleState = "primed";
              return { goalId: "goal_created" };
            },
          },
        }}
      />,
    );

    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Ready to create your first goal."),
    );
    stdin.write("g");
    await waitForFrame(lastFrame, (frame) => frame.includes("Author Goal"));

    stdin.write("Prototype Cockpit goal authoring");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Open goal authoring from Cockpit");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Wizard opens and closes");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("src/presentation/tui");
    await tick();
    stdin.write("\t");
    await tick();
    stdin.write("src/application");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) =>
      !frame.includes("Ready to create your first goal."),
    );

    expect(addGoalRequests).toEqual([
      {
        title: "Prototype Cockpit goal authoring",
        objective: "Open goal authoring from Cockpit",
        successCriteria: ["Wizard opens and closes"],
        scopeIn: ["src/presentation/tui"],
        scopeOut: ["src/application"],
        nextGoalId: undefined,
        previousGoalId: undefined,
        prerequisiteGoals: undefined,
        branch: undefined,
        worktree: undefined,
      },
    ]);
    expect(lastFrame()).not.toContain("Author Goal");
    expect(lastFrame()).not.toContain("to add a goal");
    unmount();
  }, 10000);

  it("routes to the primed cockpit after creating a goal even before the summary reader catches up", async () => {
    const { stdin, lastFrame, unmount } = render(
      <TuiApp
        stateReaderControllers={{
          getProjectSummaryQueryHandler:
            projectSummaryController("primed-empty"),
        }}
        actionControllers={{
          addGoalController: {
            handle: async (_request: AddGoalRequest) => ({
              goalId: "goal_created",
            }),
          },
        }}
      />,
    );

    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Ready to create your first goal."),
    );
    stdin.write("g");
    await waitForFrame(lastFrame, (frame) => frame.includes("Author Goal"));

    stdin.write("Prototype Cockpit goal authoring");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Open goal authoring from Cockpit");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Wizard opens and closes");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("Scope in"));

    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("Previous goal"));

    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("Branch"));

    stdin.write("\r");
    await tick();
    stdin.write("\r");

    await waitForFrame(lastFrame, (frame) =>
      !frame.includes("Ready to create your first goal."),
    );

    expect(lastFrame()).not.toContain("to add a goal");
    expect(lastFrame()).toContain("EVENTS//");
    unmount();
  }, 10000);

  it("routes from skipped unprimed cockpit to launchpad after creating a goal", async () => {
    const { stdin, lastFrame, unmount } = render(
      <TuiApp
        stateReaderControllers={{
          getProjectSummaryQueryHandler: projectSummaryController("unprimed"),
        }}
        actionControllers={{
          addGoalController: {
            handle: async (_request: AddGoalRequest) => ({
              goalId: "goal_created",
            }),
          },
        }}
      />,
    );

    await waitForFrame(lastFrame, (frame) => frame.includes("Test Project"));
    stdin.write("s");
    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Ready to create your first goal."),
    );
    stdin.write("g");
    await waitForFrame(lastFrame, (frame) => frame.includes("Author Goal"));

    stdin.write("Prototype Cockpit goal authoring");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Open goal authoring from Cockpit");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Wizard opens and closes");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("Scope in"));

    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("Previous goal"));

    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("Branch"));

    stdin.write("\r");
    await tick();
    stdin.write("\r");

    await waitForFrame(lastFrame, (frame) => frame.includes("EVENTS//"));

    expect(lastFrame()).not.toContain("to add a goal");
    unmount();
  }, 10000);

  it("installs project state readers after bare init completes", async () => {
    const actionControllers = {
      planProjectInitController: {
        handle: async () => ({
          availableAgents: [],
          plannedChanges: [],
        }),
      },
      initializeProjectController: {
        handle: async () => ({
          projectId: "project_123",
          changes: [],
        }),
      },
    };
    const onProjectInitialized = async () => ({
      getProjectSummaryQueryHandler: projectSummaryController("unprimed"),
    });

    const { stdin, lastFrame, unmount } = render(
      <TuiApp
        actionControllers={actionControllers}
        onProjectInitialized={onProjectInitialized}
      />,
    );

    await waitForFrame(lastFrame, (frame) => frame.includes("Uninitialized"));
    stdin.write("i");
    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Initialize Project"),
    );
    expect(lastFrame()).toContain("Initialize Project");
    stdin.write("MyProject");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("Test Project"));

    expect(lastFrame()).toContain("Test Project");
    expect(lastFrame()).not.toContain("Status   │ Uninitialized");
    unmount();
  }, 10000);
});
