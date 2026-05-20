import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { CockpitLaunchpadView } from "../../../../src/presentation/tui/screens/CockpitLaunchpadView.js";
import { TuiStateReaderProvider } from "../../../../src/presentation/tui/state/TuiStateReader.js";

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

describe("CockpitLaunchpadView launchpad header", () => {
  it("removes the project panel from the primed launchpad", () => {
    const { lastFrame, unmount } = render(<CockpitLaunchpadView />);
    expect(lastFrame()!).toContain("COCKPIT//");
    expect(lastFrame()!).not.toContain("PROJECT//");
    expect(lastFrame()!).not.toContain(process.cwd());
    unmount();
  });

  it("does not render project summary copy from the state reader", async () => {
    const { lastFrame, unmount } = render(
      <TuiStateReaderProvider
        controllers={{
          getProjectSummaryQueryHandler: {
            execute: async () => ({
              name: "Project Atlas",
              purpose: "Map context into the TUI",
              lifecycleState: "primed",
            }),
          },
        }}
        options={{ tickMs: 0 }}
      >
        <CockpitLaunchpadView />
      </TuiStateReaderProvider>,
    );

    const frame = await waitForFrame(lastFrame, "COCKPIT//");

    expect(frame).toContain("COCKPIT//");
    expect(frame).not.toContain("Project Atlas");
    expect(frame).not.toContain("Map context into the TUI");
    unmount();
  });
});
