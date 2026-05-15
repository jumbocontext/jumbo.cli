import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { DecisionsScreen } from "../../../../src/presentation/tui/screens/DecisionsScreen.js";
import { PLACEHOLDER_DECISIONS } from "../../../../src/presentation/tui/screens/memory/MemoryPlaceholderData.js";

describe("DecisionsScreen", () => {
  it("renders a focused decision list and selected detail", () => {
    const { lastFrame, unmount } = render(<DecisionsScreen />);
    const frame = lastFrame() ?? "";

    expect(frame).toContain("Decisions List");
    expect(frame).toContain("Decision Detail");
    expect(frame).toContain(PLACEHOLDER_DECISIONS[0].id);
    expect(frame).not.toContain("Invariants List");
    unmount();
  });
});
