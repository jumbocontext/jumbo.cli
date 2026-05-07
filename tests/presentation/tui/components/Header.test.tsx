import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { Header } from "../../../../src/presentation/tui/components/Header.js";

describe("Header", () => {
  it("renders project name on the left", () => {
    const { lastFrame } = render(
      <Header projectName="MyProject" version="1.2.3" terminalWidth={80} />,
    );
    expect(lastFrame()).toContain("MyProject");
  });

  it("renders version on the right", () => {
    const { lastFrame } = render(
      <Header projectName="MyProject" version="1.2.3" terminalWidth={80} />,
    );
    expect(lastFrame()).toContain("v1.2.3");
  });

  it("renders a divider line spanning terminal width", () => {
    const { lastFrame } = render(
      <Header projectName="MyProject" version="1.2.3" terminalWidth={40} />,
    );
    expect(lastFrame()).toContain("─".repeat(40));
  });

  it("does not render screen tab labels", () => {
    const { lastFrame } = render(
      <Header projectName="MyProject" version="1.2.3" terminalWidth={80} />,
    );
    const frame = lastFrame()!;
    expect(frame).not.toContain("Cockpit");
    expect(frame).not.toContain("Goals");
    expect(frame).not.toContain("Memory");
    expect(frame).not.toContain("Session");
  });

  it("does not render selector glyph", () => {
    const { lastFrame } = render(
      <Header projectName="MyProject" version="1.2.3" terminalWidth={80} />,
    );
    expect(lastFrame()).not.toContain("▸");
  });
});
