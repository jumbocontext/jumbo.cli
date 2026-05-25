import React from "react";
import { describe, expect, it } from "@jest/globals";
import { Text, useInput } from "ink";
import { render } from "ink-testing-library";
import {
  TuiStateReaderProvider,
  useGoalsList,
  useProjectContext,
} from "../../../../src/presentation/tui/state-reading/TuiStateReader.js";
import type { GoalView } from "../../../../src/application/context/goals/GoalView.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 50));

async function waitForFrame(
  readFrame: () => string | undefined,
  expectedText: string,
): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const frame = readFrame() ?? "";

    if (frame.includes(expectedText)) {
      return frame;
    }

    await new Promise((resolve) => setTimeout(resolve, 25));
  }

  return readFrame() ?? "";
}

const GOAL_VIEW: GoalView = {
  goalId: "goal_reader",
  title: "Wire reader",
  objective: "Read goals through controller",
  successCriteria: ["Controller response rendered"],
  scopeIn: ["src/presentation/tui"],
  scopeOut: ["src/domain"],
  status: "refined",
  version: 1,
  createdAt: "2026-05-15T00:00:00.000Z",
  updatedAt: "2026-05-15T00:00:00.000Z",
  progress: [],
};

function ProjectContextProbe(): React.ReactElement {
  const projectContext = useProjectContext();
  return <Text>{projectContext.data?.name ?? "loading"}</Text>;
}

function GoalsListProbe(): React.ReactElement {
  const goalsList = useGoalsList("refined");
  useInput((input) => {
    if (input === "r") {
      void goalsList.refresh();
    }
  });

  return <Text>{goalsList.data?.goals.length ?? 0}</Text>;
}

describe("TuiStateReader", () => {
  it("reads project context through the injected query handler", async () => {
    const getProjectSummaryQueryHandler = {
      execute: async () => ({
        name: "Jumbo Project",
        purpose: "Context orchestration",
        lifecycleState: "primed" as const,
      }),
    };

    const { lastFrame, unmount } = render(
      <TuiStateReaderProvider
        controllers={{ getProjectSummaryQueryHandler }}
        options={{ tickMs: 0 }}
      >
        <ProjectContextProbe />
      </TuiStateReaderProvider>,
    );

    const frame = await waitForFrame(lastFrame, "Jumbo Project");

    expect(frame).toContain("Jumbo Project");
    unmount();
  });

  it("passes status filters to the goals controller", async () => {
    const handledRequests: unknown[] = [];
    const getGoalsController = {
      handle: async (request: unknown) => {
        handledRequests.push(request);
        return { goals: [GOAL_VIEW] };
      },
    };

    const { lastFrame, unmount } = render(
      <TuiStateReaderProvider
        controllers={{ getGoalsController }}
        options={{ tickMs: 0 }}
      >
        <GoalsListProbe />
      </TuiStateReaderProvider>,
    );

    await tick();

    expect(lastFrame()).toContain("1");
    expect(handledRequests).toEqual([{ statuses: ["refined"] }]);
    unmount();
  });

  it("can refresh read models on explicit demand", async () => {
    let goalCount = 0;
    const getGoalsController = {
      handle: async () => {
        goalCount += 1;
        return {
          goals: Array.from({ length: goalCount }, (_, index) => ({
            ...GOAL_VIEW,
            goalId: `goal_${index}`,
          })),
        };
      },
    };

    const { stdin, lastFrame, unmount } = render(
      <TuiStateReaderProvider
        controllers={{ getGoalsController }}
        options={{ tickMs: 0 }}
      >
        <GoalsListProbe />
      </TuiStateReaderProvider>,
    );

    await tick();
    expect(lastFrame()).toContain("1");

    stdin.write("r");
    await tick();

    expect(lastFrame()).toContain("2");
    unmount();
  });

  it("re-reads on the configured tick", async () => {
    let readCount = 0;
    const getGoalsController = {
      handle: async () => {
        readCount += 1;
        return { goals: [GOAL_VIEW] };
      },
    };

    const { unmount } = render(
      <TuiStateReaderProvider
        controllers={{ getGoalsController }}
        options={{ tickMs: 10 }}
      >
        <GoalsListProbe />
      </TuiStateReaderProvider>,
    );

    await new Promise((resolve) => setTimeout(resolve, 35));

    expect(readCount).toBeGreaterThan(1);
    unmount();
  });
});
