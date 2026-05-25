import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { GoalsScreen } from "../../../../src/presentation/tui/goals/GoalsScreen.js";
import { TuiStateReaderProvider } from "../../../../src/presentation/tui/state-reading/TuiStateReader.js";

async function waitForFrame(readFrame: () => string | undefined, text: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const frame = readFrame() ?? "";
    if (frame.includes(text)) return frame;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return readFrame() ?? "";
}

function renderGoalsScreen(): ReturnType<typeof render> {
  return render(
    <TuiStateReaderProvider
      controllers={{
        getGoalsController: {
          handle: async () => ({
            goals: [
              {
                goalId: "goal_real",
                title: "Real goal",
                objective: "Render a goal from GetGoalsResponse",
                successCriteria: ["Goal response rendered"],
                scopeIn: ["src/presentation/tui/goals"],
                scopeOut: ["src/domain"],
                status: "doing",
                version: 1,
                createdAt: "2026-05-15T00:00:00.000Z",
                updatedAt: "2026-05-15T00:00:00.000Z",
                progress: ["Wired to response"],
                prerequisiteGoals: ["goal_dependency"],
                nextGoalId: "goal_next",
              },
            ],
          }),
        },
      }}
      options={{ tickMs: 0 }}
    >
      <GoalsScreen />
    </TuiStateReaderProvider>,
  );
}

describe("GoalsScreen", () => {
  it("renders a response-backed goal list with status indicators", async () => {
    const { lastFrame, unmount } = renderGoalsScreen();

    const frame = await waitForFrame(lastFrame, "Real goal");
    expect(frame).toContain("Goal List");
    expect(frame).toContain("Real goal");
    expect(frame).toContain("doing");
    unmount();
  });

  it("renders selected goal details from the response", async () => {
    const { lastFrame, unmount } = renderGoalsScreen();

    const frame = await waitForFrame(lastFrame, "Goal Detail");
    expect(frame).toContain("Goal Detail");
    expect(frame).toContain("Title");
    expect(frame).toContain("Objective");
    expect(frame).toContain("Criteria");
    expect(frame).toContain("Scope in");
    expect(frame).toContain("Prerequisites");
    expect(frame).toContain("Progress");
    expect(frame).toContain("goal_dependency");
    expect(frame).toContain("Action Hints");
    unmount();
  });

  it("opens the goal authoring wizard from the goals screen", async () => {
    const { lastFrame, stdin, unmount } = renderGoalsScreen();

    stdin.write("a");
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(lastFrame()).toContain("Author Goal");
    expect(lastFrame()).toContain("Objective");
    unmount();
  });
});
