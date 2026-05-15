import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { InvariantsScreen } from "../../../../src/presentation/tui/screens/InvariantsScreen.js";
import { PLACEHOLDER_INVARIANTS } from "../../../../src/presentation/tui/screens/memory/MemoryPlaceholderData.js";

describe("InvariantsScreen", () => {
  it("renders a focused invariant list and selected detail", () => {
    const { lastFrame, unmount } = render(<InvariantsScreen />);
    const frame = lastFrame() ?? "";

    expect(frame).toContain("Invariants List");
    expect(frame).toContain("Invariant Detail");
    expect(frame).toContain(PLACEHOLDER_INVARIANTS[0].id);
    expect(frame).not.toContain("Components List");
    unmount();
  });
});
