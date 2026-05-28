import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { CockpitLaunchpadWelcome } from "../../../../src/presentation/tui/cockpit/CockpitLaunchpadWelcome.js";
import { CockpitLaunchpadWelcomeCopy } from "../../../../src/presentation/tui/cockpit/CockpitLaunchpadWelcomeCopy.js";

describe("CockpitLaunchpadWelcome", () => {
  it("renders welcome panel structure and dismissal affordance from welcome copy", () => {
    const { lastFrame, unmount } = render(<CockpitLaunchpadWelcome />);

    expect(lastFrame()).toContain(CockpitLaunchpadWelcomeCopy.title);
    expect(lastFrame()).toContain(CockpitLaunchpadWelcomeCopy.hidePrompt.char);
    expect(lastFrame()).toContain(CockpitLaunchpadWelcomeCopy.hidePrompt.label);
    unmount();
  });
});
