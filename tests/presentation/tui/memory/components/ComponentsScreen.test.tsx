import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { ComponentsScreen } from "../../../../../src/presentation/tui/memory/components/ComponentsScreen.js";
import { TuiStateReaderProvider } from "../../../../../src/presentation/tui/state-reading/TuiStateReader.js";

async function waitForFrame(readFrame: () => string | undefined, text: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const frame = readFrame() ?? "";
    if (frame.includes(text)) return frame;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return readFrame() ?? "";
}

describe("ComponentsScreen", () => {
  it("renders a focused component list and selected detail", async () => {
    const { lastFrame, unmount } = render(
      <TuiStateReaderProvider
        controllers={{
          getComponentsController: {
            handle: async () => ({
              components: [{
                componentId: "component_real",
                name: "RealComponent",
                type: "ui",
                description: "Rendered from a response",
                responsibility: "Expose component state",
                path: "src/presentation/tui/memory/components/ComponentsScreen.tsx",
                status: "active",
                deprecationReason: null,
                version: 1,
                createdAt: "2026-05-15T00:00:00.000Z",
                updatedAt: "2026-05-15T00:00:00.000Z",
              }],
            }),
          },
        }}
        options={{ tickMs: 0 }}
      >
        <ComponentsScreen />
      </TuiStateReaderProvider>,
    );
    const frame = await waitForFrame(lastFrame, "component_real");

    expect(frame).toContain("Components List");
    expect(frame).toContain("Component Detail");
    expect(frame).toContain("component_real");
    expect(frame).not.toContain("src/presentation/tui/memory/components/ComponentsScreen.tsx");
    expect(frame).not.toContain("Dependencies List");
    unmount();
  });
});
