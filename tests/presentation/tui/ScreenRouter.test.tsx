import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { ScreenRouter } from "../../../src/presentation/tui/ScreenRouter.js";

describe("ScreenRouter", () => {
  it("renders the Cockpit screen at index 0", () => {
    const { lastFrame } = render(<ScreenRouter activeScreenIndex={0} />);
    expect(lastFrame()).toContain("▓▒▒▒▒▒▒▒▒▒▓");
  });

  it("renders the Goals screen at index 1", () => {
    const { lastFrame } = render(<ScreenRouter activeScreenIndex={1} />);
    expect(lastFrame()).toContain("Goals");
  });

  it("renders the Memory screen at index 2", () => {
    const { lastFrame } = render(<ScreenRouter activeScreenIndex={2} />);
    expect(lastFrame()).toContain("Memory");
  });

  it("renders the Session screen at index 3", () => {
    const { lastFrame } = render(<ScreenRouter activeScreenIndex={3} />);
    expect(lastFrame()).toContain("Session");
  });

  it("falls back to Cockpit for out-of-bounds index", () => {
    const { lastFrame } = render(<ScreenRouter activeScreenIndex={99} />);
    expect(lastFrame()).toContain("▓▒▒▒▒▒▒▒▒▒▓");
  });
});
