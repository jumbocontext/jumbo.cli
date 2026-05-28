import { describe, expect, it } from "@jest/globals";
import { CockpitLaunchpadWelcomeCopy } from "../../../../src/presentation/tui/cockpit/CockpitLaunchpadWelcomeCopy.js";

describe("CockpitLaunchpadWelcomeCopy", () => {
  it("keeps launchpad welcome copy and dismissal prompt together", () => {
    expect(CockpitLaunchpadWelcomeCopy.title.length).toBeGreaterThan(0);
    expect(CockpitLaunchpadWelcomeCopy.paragraphs).toHaveLength(2);
    expect(CockpitLaunchpadWelcomeCopy.hidePrompt.char).toHaveLength(1);
    expect(CockpitLaunchpadWelcomeCopy.hidePrompt.label.length).toBeGreaterThan(0);
  });
});
