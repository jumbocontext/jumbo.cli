import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { CockpitGreeterView } from "../../../../src/presentation/tui/screens/CockpitGreeterView.js";

describe("CockpitGreeterView", () => {
  it("renders the directory label", () => {
    const { lastFrame } = render(<CockpitGreeterView directory="/projects/test" />);
    expect(lastFrame()).toContain("Directory");
  });

  it("renders the provided directory path", () => {
    const { lastFrame } = render(<CockpitGreeterView directory="/projects/test" />);
    expect(lastFrame()).toContain("/projects/test");
  });

  it("renders the status as Uninitialized", () => {
    const { lastFrame } = render(<CockpitGreeterView directory="/projects/test" />);
    expect(lastFrame()).toContain("Uninitialized");
  });

  it("renders the welcome message", () => {
    const { lastFrame } = render(<CockpitGreeterView />);
    expect(lastFrame()).toContain("Hi, I'm Jumbo");
  });

  it("explains what Jumbo does", () => {
    const { lastFrame } = render(<CockpitGreeterView />);
    expect(lastFrame()).toContain("memory");
  });

  it("renders the initialize key indicator", () => {
    const { lastFrame } = render(<CockpitGreeterView />);
    expect(lastFrame()).toContain("│ i │");
  });

  it("renders the initialize call-to-action", () => {
    const { lastFrame } = render(<CockpitGreeterView />);
    expect(lastFrame()).toContain("to initialize");
  });

  it("renders the terminal alternative", () => {
    const { lastFrame } = render(<CockpitGreeterView />);
    expect(lastFrame()).toContain("jumbo init");
  });
});
