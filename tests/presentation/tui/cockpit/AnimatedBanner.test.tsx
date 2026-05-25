import React from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { render } from "ink-testing-library";
import {
  AnimatedBanner,
  getGradientHex,
} from "../../../../src/presentation/tui/cockpit/AnimatedBanner.js";

describe("AnimatedBanner", () => {
  it("renders a non-empty frame on mount", () => {
    const { lastFrame, unmount } = render(<AnimatedBanner onComplete={jest.fn()} />);
    expect((lastFrame() ?? "").trim().length).toBeGreaterThan(0);
    unmount();
  });

  it("renders without crashing when version and projectName are provided", () => {
    const { lastFrame, unmount } = render(
      <AnimatedBanner onComplete={jest.fn()} version="1.0.0" projectName="test-project" />,
    );
    expect((lastFrame() ?? "").trim().length).toBeGreaterThan(0);
    unmount();
  });
});

describe("getGradientHex", () => {
  it("returns a valid hex color string for any progress value", () => {
    expect(getGradientHex(0)).toMatch(/^#[0-9a-f]{6}$/);
    expect(getGradientHex(0.5)).toMatch(/^#[0-9a-f]{6}$/);
    expect(getGradientHex(1)).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("clamps progress below 0 to the start color", () => {
    expect(getGradientHex(-1)).toBe(getGradientHex(0));
  });

  it("clamps progress above 1 to the end color", () => {
    expect(getGradientHex(2)).toBe(getGradientHex(1));
  });

  it("produces different colors at different progress values", () => {
    const atQuarter = getGradientHex(0.25);
    const atHalf = getGradientHex(0.5);
    const atThreeQuarters = getGradientHex(0.75);
    expect(atQuarter).not.toBe(atHalf);
    expect(atHalf).not.toBe(atThreeQuarters);
  });
});
