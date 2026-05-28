import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { MemoryEntityScreen } from "../../../../../src/presentation/tui/memory/entity-browser/MemoryEntityScreen.js";
import type { DecisionEntityRow } from "../../../../../src/presentation/tui/memory/entity-browser/MemoryEntityShapes.js";

const DOWN_ARROW = "\x1B[B";
const DECISION_ROWS: readonly DecisionEntityRow[] = [
  {
    id: "decision_first",
    title: "First decision",
    context: "A test row",
    rationale: "Keeps the primitive test local",
    alternatives: [],
    consequences: "",
  },
  {
    id: "decision_second",
    title: "Second decision",
    context: "Another test row",
    rationale: "Exercises selection",
    alternatives: [],
    consequences: "",
  },
];

describe("MemoryEntityScreen", () => {
  it("renders one entity type as a list/detail screen", () => {
    const { lastFrame, unmount } = render(
      <MemoryEntityScreen
        entityType="decision"
        title="Decisions"
        subtitle="Focused decision memory list"
        rows={DECISION_ROWS}
      />,
    );
    const frame = lastFrame() ?? "";

    expect(frame).toContain(DECISION_ROWS[0].id);
    expect(frame).toContain(DECISION_ROWS[0].title);
    expect(frame).not.toContain(DECISION_ROWS[1].id);
    unmount();
  });

  it("moves the selected detail with arrow-key list navigation", async () => {
    const { lastFrame, stdin, unmount } = render(
      <MemoryEntityScreen
        entityType="decision"
        title="Decisions"
        subtitle="Focused decision memory list"
        rows={DECISION_ROWS}
      />,
    );

    stdin.write(DOWN_ARROW);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(lastFrame() ?? "").toContain(DECISION_ROWS[1].id);
    unmount();
  });

  it("advances event replay state", async () => {
    const { lastFrame, stdin, unmount } = render(
      <MemoryEntityScreen
        entityType="decision"
        title="Decisions"
        subtitle="Focused decision memory list"
        rows={DECISION_ROWS}
      />,
    );

    const beforeFrame = lastFrame() ?? "";

    stdin.write("]");
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(lastFrame() ?? "").not.toEqual(beforeFrame);
    unmount();
  });
});
