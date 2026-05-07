import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { TuiApp } from "../../../src/presentation/tui/TuiApp.js";

describe("TuiApp", () => {
  it("renders header with project name", () => {
    const { lastFrame } = render(<TuiApp />);
    expect(lastFrame()).toContain("Jumbo");
  });

  it("renders header with version", () => {
    const { lastFrame } = render(<TuiApp />);
    expect(lastFrame()).toContain("v0.0.0");
  });

  it("does not render screen tab labels in header", () => {
    const { lastFrame } = render(<TuiApp />);
    const frame = lastFrame()!;
    expect(frame).not.toContain("▸");
  });

  it("renders footer with keybinding hints", () => {
    const { lastFrame } = render(<TuiApp />);
    expect(lastFrame()).toContain("m menu");
    expect(lastFrame()).toContain("q quit");
  });

  it("renders footer with daemon health placeholder", () => {
    const { lastFrame } = render(<TuiApp />);
    expect(lastFrame()).toContain("daemons");
  });

  it("shows Cockpit screen by default", () => {
    const { lastFrame } = render(<TuiApp />);
    expect(lastFrame()).toContain("Project orientation");
  });

  it("opens MegaMenu on m key press", async () => {
    const { stdin, lastFrame } = render(<TuiApp />);
    stdin.write("m");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(lastFrame()).toContain("Navigate");
  });

  it("opens MegaMenu on M key press", async () => {
    const { stdin, lastFrame } = render(<TuiApp />);
    stdin.write("M");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(lastFrame()).toContain("Navigate");
  });

  it("switches screen via MegaMenu enter key", async () => {
    const { stdin, lastFrame } = render(<TuiApp />);
    stdin.write("m");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("\x1B[B");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("\r");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(lastFrame()).toContain("Goal backlog");
  });

  it("closes MegaMenu on escape without changing screen", async () => {
    const { stdin, lastFrame } = render(<TuiApp />);
    stdin.write("m");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(lastFrame()).toContain("Navigate");
    stdin.write("\x1B");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(lastFrame()).not.toContain("Navigate");
    expect(lastFrame()).toContain("Project orientation");
  });

  it("does not quit when q is pressed while MegaMenu is open", async () => {
    const { stdin, lastFrame } = render(<TuiApp />);
    stdin.write("m");
    await new Promise((resolve) => setTimeout(resolve, 50));
    stdin.write("q");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(lastFrame()).toContain("Navigate");
  });
});
