import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { CockpitUnprimedView } from "../../../../src/presentation/tui/screens/CockpitUnprimedView.js";

describe("CockpitUnprimedView", () => {
  it("renders the existing project message", () => {
    const { lastFrame } = render(<CockpitUnprimedView />);
    expect(lastFrame()).toContain("existing project");
  });

  it("explains the value of priming", () => {
    const { lastFrame } = render(<CockpitUnprimedView />);
    expect(lastFrame()).toContain("Goals work best");
  });

  it("instructs to open another shell", () => {
    const { lastFrame } = render(<CockpitUnprimedView />);
    expect(lastFrame()).toContain("Open another shell");
  });

  it("renders the agent nudge note", () => {
    const { lastFrame } = render(<CockpitUnprimedView />);
    expect(lastFrame()).toContain("nudge your agent");
  });

  it("mentions future instructions prompt", () => {
    const { lastFrame } = render(<CockpitUnprimedView />);
    expect(lastFrame()).toContain("future instructions");
  });
});
