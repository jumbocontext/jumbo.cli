import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { DependenciesScreen } from "../../../../src/presentation/tui/screens/DependenciesScreen.js";
import { PLACEHOLDER_DEPENDENCIES } from "../../../../src/presentation/tui/screens/memory/MemoryPlaceholderData.js";

describe("DependenciesScreen", () => {
  it("renders a focused dependency list and selected detail", () => {
    const { lastFrame, unmount } = render(<DependenciesScreen />);
    const frame = lastFrame() ?? "";

    expect(frame).toContain("Dependencies List");
    expect(frame).toContain("Dependency Detail");
    expect(frame).toContain(PLACEHOLDER_DEPENDENCIES[0].id);
    expect(frame).not.toContain("Guidelines List");
    unmount();
  });
});
