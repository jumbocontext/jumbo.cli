import React from "react";
import { jest, describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { CockpitLaunchpadView } from "../../../../src/presentation/tui/cockpit/CockpitLaunchpadView.js";
import { TuiStateReaderProvider } from "../../../../src/presentation/tui/state-reading/TuiStateReader.js";
import type { Settings } from "../../../../src/application/settings/Settings.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 50));
const defaultSettings: Settings = {
  qa: { defaultTurnLimit: 3 },
  claims: { claimDurationMinutes: 30 },
  telemetry: { enabled: true, anonymousId: null, consentGiven: false },
  tui: { showLaunchpadWelcome: true },
};

describe("CockpitLaunchpadView launchpad header", () => {
  it("removes the project panel from the primed launchpad", () => {
    const { lastFrame, unmount } = render(<CockpitLaunchpadView />);
    expect(lastFrame()).toBeDefined();
    expect(lastFrame()).not.toContain(process.cwd());
    unmount();
  });

  it("does not query project summary data for the primed launchpad", () => {
    const execute = jest.fn(async () => ({
      name: "Project Atlas",
      purpose: "Map context into the TUI",
      lifecycleState: "primed",
    }));
    const { unmount } = render(
      <TuiStateReaderProvider
        controllers={{
          getProjectSummaryQueryHandler: {
            execute,
          },
        }}
        options={{ tickMs: 0 }}
      >
        <CockpitLaunchpadView />
      </TuiStateReaderProvider>,
    );

    expect(execute).not.toHaveBeenCalled();
    unmount();
  });

  it("persists the launchpad welcome dismissal through settings", async () => {
    const settingsReader = {
      read: jest.fn(async () => defaultSettings),
      write: jest.fn(async (_settings: Settings) => {}),
    };
    const { stdin, unmount } = render(
      <CockpitLaunchpadView
        settingsReader={settingsReader}
        reviewerFrameDurationMs={0}
        refinerFrameDurationMs={0}
        codifierFrameDurationMs={0}
      />,
    );

    await tick();
    stdin.write("x");
    await tick();

    expect(settingsReader.write).toHaveBeenCalledWith({
      ...defaultSettings,
      tui: { showLaunchpadWelcome: false },
    });
    unmount();
  });

  it("does not rewrite settings when the stored preference already hides the welcome panel", async () => {
    const settingsReader = {
      read: jest.fn(async () => ({
        ...defaultSettings,
        tui: { showLaunchpadWelcome: false },
      })),
      write: jest.fn(async (_settings: Settings) => {}),
    };
    const { stdin, unmount } = render(
      <CockpitLaunchpadView
        settingsReader={settingsReader}
        reviewerFrameDurationMs={0}
        refinerFrameDurationMs={0}
        codifierFrameDurationMs={0}
      />,
    );

    await tick();
    stdin.write("x");
    await tick();

    expect(settingsReader.write).not.toHaveBeenCalled();
    unmount();
  });
});
