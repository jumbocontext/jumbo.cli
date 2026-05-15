import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { MemoryEntityScreen } from "../../../../../src/presentation/tui/screens/memory/MemoryEntityScreen.js";
import { PLACEHOLDER_DECISIONS } from "../../../../../src/presentation/tui/screens/memory/MemoryPlaceholderData.js";

const DOWN_ARROW = "\x1B[B";

describe("MemoryEntityScreen", () => {
  it("renders one entity type as a list/detail screen", () => {
    const { lastFrame, unmount } = render(
      <MemoryEntityScreen
        entityType="decision"
        title="Decisions"
        subtitle="Focused decision memory list"
        rows={PLACEHOLDER_DECISIONS}
      />,
    );
    const frame = lastFrame() ?? "";

    expect(frame).toContain("Decisions List");
    expect(frame).toContain("Decision Detail");
    expect(frame).toContain(PLACEHOLDER_DECISIONS[0].id);
    expect(frame).toContain("Event Replay");
    unmount();
  });

  it("moves the selected detail with arrow-key list navigation", async () => {
    const { lastFrame, stdin, unmount } = render(
      <MemoryEntityScreen
        entityType="decision"
        title="Decisions"
        subtitle="Focused decision memory list"
        rows={PLACEHOLDER_DECISIONS}
      />,
    );

    stdin.write(DOWN_ARROW);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(lastFrame() ?? "").toContain(PLACEHOLDER_DECISIONS[1].id);
    unmount();
  });

  it("advances placeholder event replay state", async () => {
    const { lastFrame, stdin, unmount } = render(
      <MemoryEntityScreen
        entityType="decision"
        title="Decisions"
        subtitle="Focused decision memory list"
        rows={PLACEHOLDER_DECISIONS}
      />,
    );

    stdin.write("]");
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(lastFrame() ?? "").toContain("event 2 of 3");
    unmount();
  });
});
