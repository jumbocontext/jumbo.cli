import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { CockpitPrimedEmptyView } from "../../../../src/presentation/tui/screens/CockpitPrimedEmptyView.js";

describe("CockpitPrimedEmptyView", () => {
  it("announces project memory is ready", () => {
    const { lastFrame } = render(<CockpitPrimedEmptyView />);
    expect(lastFrame()).toContain("Project memory is ready");
  });

  it("explains what goals are", () => {
    const { lastFrame } = render(<CockpitPrimedEmptyView />);
    expect(lastFrame()).toContain("objective, success criteria, and scope");
  });

  it("explains context packet delivery", () => {
    const { lastFrame } = render(<CockpitPrimedEmptyView />);
    expect(lastFrame()).toContain("focused context packet");
  });

  it("explains continuous learning", () => {
    const { lastFrame } = render(<CockpitPrimedEmptyView />);
    expect(lastFrame()).toContain("corrections and discoveries");
  });

  it("renders the add goal key indicator", () => {
    const { lastFrame } = render(<CockpitPrimedEmptyView />);
    expect(lastFrame()).toContain("[g]");
  });

  it("renders the add goal call-to-action", () => {
    const { lastFrame } = render(<CockpitPrimedEmptyView />);
    expect(lastFrame()).toContain("to add a goal");
  });

  it("renders the terminal alternative", () => {
    const { lastFrame } = render(<CockpitPrimedEmptyView />);
    expect(lastFrame()).toContain("jumbo goal add");
  });
});
