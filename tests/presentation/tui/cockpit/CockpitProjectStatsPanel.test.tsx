import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { CockpitProjectStatsPanel } from "../../../../src/presentation/tui/cockpit/CockpitProjectStatsPanel.js";
import { TuiStateReaderProvider } from "../../../../src/presentation/tui/state-reading/TuiStateReader.js";

async function waitForFrame(
  readFrame: () => string | undefined,
  expectedText: string,
): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const frame = readFrame() ?? "";

    if (frame.includes(expectedText)) {
      return frame;
    }

    await new Promise((resolve) => setTimeout(resolve, 25));
  }

  return readFrame() ?? "";
}

describe("CockpitProjectStatsPanel", () => {
  it("renders aggregate project stats without named diagnostics", async () => {
    const projectStatsController = {
      handle: async () => ({
        snapshot: {
          project: {
            audiences: {
              totalAudiences: 3,
              primaryAudiences: 1,
              secondaryAudiences: 2,
            },
            audiencePains: {
              audiencePainsCount: 4,
            },
            valuePropositions: {
              valuePropositionsCount: 2,
            },
          },
          work: {
            goals: {
              definedGoalsCount: 1,
              refinedGoalsCount: 2,
              inProgressGoalsCount: 1,
              submittedGoalsCount: 1,
              closedGoalsCount: 0,
            },
            sessions: {
              sessionsCount: 2,
            },
          },
          memory: {
            decisions: {
              decisionsCount: 4,
            },
            components: {
              componentsCount: 2,
            },
            dependencies: {
              dependenciesCount: 1,
            },
            invariants: {
              invariantsCount: 1,
            },
            guidelines: {
              guidelinesCount: 1,
            },
          },
          graph: {
            relationCount: 6,
          },
        },
      }),
    };

    const { lastFrame, unmount } = render(
      <TuiStateReaderProvider
        controllers={{ projectStatsController }}
        options={{ tickMs: 0 }}
      >
        <CockpitProjectStatsPanel />
      </TuiStateReaderProvider>,
    );

    const frame = await waitForFrame(lastFrame, "audiences 3");

    expect(frame).toContain("audiences 3");
    expect(frame).toContain("refined 2");
    expect(frame).toContain("relations 6");
    expect(frame).not.toContain("goal_orphan");
    expect(frame).not.toContain("component_without_goal");
    expect(frame).not.toMatch(/architecture/i);
    unmount();
  });
});
