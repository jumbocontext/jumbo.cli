import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { CockpitLaunchpadView } from "../../../../src/presentation/tui/screens/CockpitLaunchpadView.js";

describe("CockpitLaunchpadView", () => {
  it("renders the goals section heading", () => {
    const { lastFrame } = render(<CockpitLaunchpadView />);
    expect(lastFrame()).toContain("GOALS");
  });

  it("renders goal items with status badges", () => {
    const { lastFrame } = render(<CockpitLaunchpadView />);
    const frame = lastFrame()!;
    expect(frame).toContain("Implement user");
    expect(frame).toContain("[doing]");
  });

  it("renders multiple goal statuses", () => {
    const { lastFrame } = render(<CockpitLaunchpadView />);
    const frame = lastFrame()!;
    expect(frame).toContain("[refused]");
    expect(frame).toContain("[submitted]");
    expect(frame).toContain("[blocked]");
    expect(frame).toContain("[approved]");
  });

  it("renders the add goal key indicator", () => {
    const { lastFrame } = render(<CockpitLaunchpadView />);
    expect(lastFrame()).toContain("[g]");
  });

  it("renders the workers section heading", () => {
    const { lastFrame } = render(<CockpitLaunchpadView />);
    expect(lastFrame()).toContain("WORKERS");
  });

  it("renders worker status indicators", () => {
    const { lastFrame } = render(<CockpitLaunchpadView />);
    const frame = lastFrame()!;
    expect(frame).toContain("Auto Goal Refiner");
    expect(frame).toContain("Auto Goal Reviewer");
    expect(frame).toContain("Auto Goal Implementor");
    expect(frame).toContain("Auto Goal Codifier");
  });

  it("renders the meta-data section", () => {
    const { lastFrame } = render(<CockpitLaunchpadView />);
    const frame = lastFrame()!;
    expect(frame).toContain("META-DATA");
    expect(frame).toContain("id:");
    expect(frame).toContain("title:");
  });

  it("renders the objective section", () => {
    const { lastFrame } = render(<CockpitLaunchpadView />);
    const frame = lastFrame()!;
    expect(frame).toContain("OBJECTIVE");
    expect(frame).toContain("analytics");
  });

  it("renders the criteria section", () => {
    const { lastFrame } = render(<CockpitLaunchpadView />);
    const frame = lastFrame()!;
    expect(frame).toContain("CRITERIA");
    expect(frame).toContain("Dashboard renders analytics widgets");
  });

  it("renders the scope-in section", () => {
    const { lastFrame } = render(<CockpitLaunchpadView />);
    const frame = lastFrame()!;
    expect(frame).toContain("SCOPE-IN");
    expect(frame).toContain("src/presentation/dashboard");
  });

  it("renders the related-invariants section", () => {
    const { lastFrame } = render(<CockpitLaunchpadView />);
    const frame = lastFrame()!;
    expect(frame).toContain("RELATED-INVARIANTS");
    expect(frame).toContain("Single Responsibility");
    expect(frame).toContain("Dependency Inversion");
  });
});
