import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { ComponentsScreen } from "../../../../src/presentation/tui/screens/ComponentsScreen.js";
import { PLACEHOLDER_COMPONENTS } from "../../../../src/presentation/tui/screens/memory/MemoryPlaceholderData.js";

describe("ComponentsScreen", () => {
  it("renders a focused component list and selected detail", () => {
    const { lastFrame, unmount } = render(<ComponentsScreen />);
    const frame = lastFrame() ?? "";

    expect(frame).toContain("Components List");
    expect(frame).toContain("Component Detail");
    expect(frame).toContain(PLACEHOLDER_COMPONENTS[0].id);
    expect(frame).not.toContain("Dependencies List");
    unmount();
  });
});
