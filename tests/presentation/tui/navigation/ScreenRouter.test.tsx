import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { ScreenRouter } from "../../../../src/presentation/tui/navigation/ScreenRouter.js";

const frameAt = (i: number) => {
  const { lastFrame, unmount } = render(<ScreenRouter activeScreenIndex={i} />);
  const frame = lastFrame()!;
  unmount();
  return frame;
};

describe("ScreenRouter", () => {
  it("renders distinct output for each screen index", () => {
    const frames = [0, 1, 2, 3, 4, 5, 6, 7].map(frameAt);
    const unique = new Set(frames);
    expect(unique.size).toBe(frames.length);
  });

  it("falls back to index 0 for out-of-bounds index", () => {
    expect(frameAt(99)).toBe(frameAt(0));
  });
});
