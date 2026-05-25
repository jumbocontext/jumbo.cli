import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { MemoryScreen } from "../../../../src/presentation/tui/memory/MemoryScreen.js";

describe("MemoryScreen", () => {
  it("renders a non-primary placeholder that points to dedicated screens", () => {
    const { lastFrame, unmount } = render(<MemoryScreen />);
    const frame = lastFrame() ?? "";

    expect(frame).toContain("Dedicated Screens");
    expect(frame).toContain("Decisions");
    expect(frame).toContain("Guidelines");
    expect(frame).not.toContain("Decision Detail");
    unmount();
  });
});
