import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { Footer } from "../../../../src/presentation/tui/components/Footer.js";

describe("Footer", () => {
  it("renders keybinding hints for menu and quit", () => {
    const { lastFrame } = render(<Footer terminalWidth={80} />);
    const frame = lastFrame()!;
    expect(frame).toContain("m menu");
    expect(frame).toContain("q quit");
  });

  it("does not render old navigation hints", () => {
    const { lastFrame } = render(<Footer terminalWidth={80} />);
    const frame = lastFrame()!;
    expect(frame).not.toContain("navigate");
    expect(frame).not.toContain("1-4 jump");
  });

  it("renders daemon health placeholder", () => {
    const { lastFrame } = render(<Footer terminalWidth={80} />);
    expect(lastFrame()).toContain("daemons");
    expect(lastFrame()).toContain("idle");
  });

  it("renders a divider line spanning terminal width", () => {
    const { lastFrame } = render(<Footer terminalWidth={40} />);
    expect(lastFrame()).toContain("─".repeat(40));
  });
});
