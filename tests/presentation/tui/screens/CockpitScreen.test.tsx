import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { CockpitScreen } from "../../../../src/presentation/tui/screens/CockpitScreen.js";

describe("CockpitScreen", () => {
  it("renders the animated banner on initial load", () => {
    const { lastFrame, unmount } = render(<CockpitScreen />);
    expect(lastFrame()).toContain("▓▒▒▒▒▒▒▒▒▒▓");
    unmount();
  });

  it("renders elephant ASCII art during banner phase", () => {
    const { lastFrame, unmount } = render(<CockpitScreen />);
    const frame = lastFrame()!;
    expect(frame).toContain("▓");
    expect(frame).toContain("▒");
    unmount();
  });

  it("shows the banner before cockpit content", () => {
    const { lastFrame, unmount } = render(<CockpitScreen />);
    const frame = lastFrame()!;
    expect(frame).not.toContain("GOALS");
    expect(frame).not.toContain("WORKERS");
    unmount();
  });

  it("accepts uninitialized state", () => {
    const { lastFrame, unmount } = render(
      <CockpitScreen state="uninitialized" />,
    );
    expect(lastFrame()).toContain("▓");
    unmount();
  });

  it("accepts unprimed state", () => {
    const { lastFrame, unmount } = render(<CockpitScreen state="unprimed" />);
    expect(lastFrame()).toContain("▓");
    unmount();
  });

  it("accepts primed-empty state", () => {
    const { lastFrame, unmount } = render(
      <CockpitScreen state="primed-empty" />,
    );
    expect(lastFrame()).toContain("▓");
    unmount();
  });

  it("accepts primed state", () => {
    const { lastFrame, unmount } = render(<CockpitScreen state="primed" />);
    expect(lastFrame()).toContain("▓");
    unmount();
  });
});
