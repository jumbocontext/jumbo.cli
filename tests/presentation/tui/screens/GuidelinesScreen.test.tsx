import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { GuidelinesScreen } from "../../../../src/presentation/tui/screens/GuidelinesScreen.js";
import { PLACEHOLDER_GUIDELINES } from "../../../../src/presentation/tui/screens/memory/MemoryPlaceholderData.js";

describe("GuidelinesScreen", () => {
  it("renders a focused guideline list and selected detail", () => {
    const { lastFrame, unmount } = render(<GuidelinesScreen />);
    const frame = lastFrame() ?? "";

    expect(frame).toContain("Guidelines List");
    expect(frame).toContain("Guideline Detail");
    expect(frame).toContain(PLACEHOLDER_GUIDELINES[0].id);
    expect(frame).not.toContain("Decisions List");
    unmount();
  });
});
