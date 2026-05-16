import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { TuiApp } from "../../../src/presentation/tui/TuiApp.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 50));
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

  it("renders a non-empty frame on mount", () => {
    const { lastFrame } = render(<TuiApp />);
    expect((lastFrame() ?? "").length).toBeGreaterThan(0);
  });

  it("changes frame when m is pressed (MegaMenu toggles open)", async () => {
    const { stdin, lastFrame } = render(<TuiApp />);
    const before = lastFrame();
    stdin.write("m");
    await tick();
    expect(lastFrame()).not.toBe(before);
  });

  it("MegaMenu closes on escape and returns to prior frame", async () => {
    const { stdin, lastFrame } = render(<TuiApp />);
    const initial = lastFrame();
    stdin.write("m");
    await tick();
    expect(lastFrame()).not.toBe(initial);
    stdin.write("\x1B");
    await tick();
    expect(lastFrame()).toContain("menu");
    expect(lastFrame()).not.toContain("Memory");
    expect(initial).toContain("menu");
  });

  it("q does not quit while MegaMenu is open", async () => {
    const { stdin, lastFrame } = render(<TuiApp />);
    stdin.write("m");
    await tick();
    expect(lastFrame()).toContain("Memory");
    stdin.write("q");
    await tick();
    expect(lastFrame()).toContain("Memory");
  });

  it("opens the init flow from the global shortcut when the project is uninitialized", async () => {
    const { stdin, lastFrame } = render(
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
  });

  it("does not open the init flow from the global shortcut after initialization", async () => {
    const { stdin, lastFrame } = render(
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
  });
});
