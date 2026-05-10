import React from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { render } from "ink-testing-library";
import {
  AnimatedBanner,
  getGradientHex,
} from "../../../../src/presentation/tui/components/AnimatedBanner.js";

describe("AnimatedBanner", () => {
  it("renders elephant ASCII art from animation frames", () => {
    const onComplete = jest.fn();
    const { lastFrame, unmount } = render(
      <AnimatedBanner onComplete={onComplete} />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("▓");
    expect(frame).toContain("▒");
    unmount();
  });

  it("renders initial frame with elephant shading characters", () => {
    const onComplete = jest.fn();
    const { lastFrame, unmount } = render(
      <AnimatedBanner onComplete={onComplete} />,
    );
    const frame = lastFrame()!;
    const shadingLines = frame
      .split("\n")
      .filter((l: string) => l.includes("▓") || l.includes("▒"));
    expect(shadingLines.length).toBeGreaterThan(0);
    unmount();
  });

  it("accepts version and projectName props", () => {
    const onComplete = jest.fn();
    const { lastFrame, unmount } = render(
      <AnimatedBanner
        onComplete={onComplete}
        version="1.0.0"
        projectName="test-project"
      />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain("▓");
    unmount();
  });
});

describe("getGradientHex", () => {
  it("returns a valid hex color string", () => {
    const hex = getGradientHex(0.5);
    expect(hex).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("returns blue at progress 0", () => {
    const hex = getGradientHex(0);
    expect(hex).toBe("#0048b6");
  });

  it("returns red at progress 1", () => {
    const hex = getGradientHex(1);
    expect(hex).toBe("#e82c31");
  });

  it("clamps progress below 0", () => {
    const hex = getGradientHex(-1);
    expect(hex).toBe(getGradientHex(0));
  });

  it("clamps progress above 1", () => {
    const hex = getGradientHex(2);
    expect(hex).toBe(getGradientHex(1));
  });

  it("produces different colors at different progress values", () => {
    const atQuarter = getGradientHex(0.25);
    const atHalf = getGradientHex(0.5);
    const atThreeQuarters = getGradientHex(0.75);
    expect(atQuarter).not.toBe(atHalf);
    expect(atHalf).not.toBe(atThreeQuarters);
  });
});
