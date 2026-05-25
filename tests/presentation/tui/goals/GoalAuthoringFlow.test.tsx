import React from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { render } from "ink-testing-library";
import { GoalAuthoringFlow } from "../../../../src/presentation/tui/goals/GoalAuthoringFlow.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 50));
const LEFT_ARROW = "\x1B[D";
const waitForFrame = async (
  lastFrame: () => string | undefined,
  predicate: (frame: string) => boolean,
) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await tick();
    const frame = lastFrame() ?? "";
    if (predicate(frame)) {
      return frame;
    }
  }
  throw new Error(`Timed out waiting for frame:\n${lastFrame() ?? ""}`);
};

describe("GoalAuthoringFlow", () => {
  it("renders the objective step using the wizard primitive", () => {
    const { lastFrame, unmount } = render(
      <GoalAuthoringFlow onComplete={() => {}} onCancel={() => {}} />,
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("Author Goal");
    expect(frame).toContain("Title");
    expect(frame).toContain("Objective");
    expect(frame).toContain("1/5");
    expect(frame).toContain("esc");
    unmount();
  });

  it("includes all goal authoring steps", async () => {
    const { lastFrame, stdin, unmount } = render(
      <GoalAuthoringFlow onComplete={() => {}} onCancel={() => {}} />,
    );

    stdin.write("Prototype S2");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Prototype the Goals screen");
    await tick();
    stdin.write("\r");
    await tick();
    expect(lastFrame()).toContain("Success criterion");
    expect(lastFrame()).toContain("2/5");

    stdin.write("Renders goals");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    expect(lastFrame()).toContain("Scope in (optional)");
    expect(lastFrame()).toContain("3/5");

    stdin.write("src/presentation/tui");
    await tick();
    stdin.write("\t");
    await tick();
    stdin.write("src/application");
    await tick();
    stdin.write("\r");
    await tick();
    expect(lastFrame()).toContain("Previous goal (optional)");
    expect(lastFrame()).toContain("4/5");
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    expect(lastFrame()).toContain("Branch (optional)");
    expect(lastFrame()).toContain("5/5");
    unmount();
  });

  it("collects success criteria as an array", async () => {
    const handleComplete = jest.fn();
    const { stdin, lastFrame, unmount } = render(
      <GoalAuthoringFlow onComplete={handleComplete} onCancel={() => {}} />,
    );

    stdin.write("Prototype S2");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Prototype the Goals screen");
    await tick();
    stdin.write("\r");
    await tick();

    stdin.write("Renders goals");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("y");
    await tick();
    stdin.write("\r");
    await tick();

    stdin.write("Shows goal detail");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("Scope in"));

    stdin.write("src/presentation/tui");
    await tick();
    stdin.write("\t");
    await tick();
    stdin.write("src/application");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("Previous goal"));

    stdin.write("goal_previous");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("goal_next");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("goal_prerequisite");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("Branch"));

    stdin.write("feature/prototype-s2");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("../jumbo-prototype-s2");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, () => handleComplete.mock.calls.length > 0);

    expect(handleComplete).toHaveBeenCalledWith({
      title: "Prototype S2",
      objective: "Prototype the Goals screen",
      successCriteria: ["Renders goals", "Shows goal detail"],
      scopeIn: "src/presentation/tui",
      scopeOut: "src/application",
      previousGoal: "goal_previous",
      nextGoal: "goal_next",
      prerequisiteGoals: "goal_prerequisite",
      branch: "feature/prototype-s2",
      worktree: "../jumbo-prototype-s2",
    });
    unmount();
  });

  it("allows scope boundaries to be left blank", async () => {
    const handleComplete = jest.fn();
    const { stdin, lastFrame, unmount } = render(
      <GoalAuthoringFlow onComplete={handleComplete} onCancel={() => {}} />,
    );

    stdin.write("Prototype S2");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Prototype the Goals screen");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Renders goals");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("Scope in"));

    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("Previous goal"));
    expect(lastFrame()).not.toContain("Required");

    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("Branch"));

    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, () => handleComplete.mock.calls.length > 0);

    expect(handleComplete).toHaveBeenCalledWith({
      title: "Prototype S2",
      objective: "Prototype the Goals screen",
      successCriteria: ["Renders goals"],
      scopeIn: "",
      scopeOut: "",
      previousGoal: "",
      nextGoal: "",
      prerequisiteGoals: "",
      branch: "",
      worktree: "",
    });
    unmount();
  });

  it("preserves earlier answers when navigating back", async () => {
    const { stdin, lastFrame, unmount } = render(
      <GoalAuthoringFlow onComplete={() => {}} onCancel={() => {}} />,
    );

    stdin.write("Prototype S2");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Prototype the Goals screen");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Renders goals");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("Scope in"));
    stdin.write("src/presentation/tui");
    await tick();
    stdin.write("\t");
    await tick();
    stdin.write("src/application");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("Previous goal"));

    stdin.write(LEFT_ARROW);
    await waitForFrame(lastFrame, (frame) => frame.includes("Scope in"));
    expect(lastFrame()).toContain("src/presentation/tui");
    expect(lastFrame()).toContain("src/application");

    stdin.write(LEFT_ARROW);
    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Success criterion"),
    );
    expect(lastFrame()).toContain("Renders goals");

    stdin.write(LEFT_ARROW);
    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Title") && frame.includes("Objective"),
    );
    expect(lastFrame()).toContain("Prototype S2");
    expect(lastFrame()).toContain("Prototype the Goals screen");
    unmount();
  });
});
