import React from "react";
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { render } from "ink-testing-library";
import fs from "fs-extra";
import * as os from "node:os";
import * as path from "node:path";
import { InitFlow } from "../../../../src/presentation/tui/project-initialization/InitFlow.js";
import { Host } from "../../../../src/infrastructure/host/Host.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 50));
const waitForFrame = async (
  lastFrame: () => string | undefined,
  predicate: (frame: string) => boolean,
  timeoutMs = 4000,
) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    await tick();
    const frame = lastFrame() ?? "";
    if (predicate(frame)) {
      return frame;
    }
  }
  throw new Error(`Timed out waiting for frame:\n${lastFrame() ?? ""}`);
};

const waitForMockCall = async (mock: jest.Mock) => {
  for (let attempt = 0; attempt < 80 && mock.mock.calls.length === 0; attempt += 1) {
    await tick();
  }
};

describe("InitFlow", () => {
  const originalCwd = process.cwd();
  const tempDirs: string[] = [];

  afterEach(async () => {
    process.chdir(originalCwd);
    for (const dir of tempDirs.splice(0)) {
      await fs.remove(dir);
    }
  });

  it("renders a non-empty frame on mount", () => {
    const { lastFrame } = render(
      <InitFlow onComplete={() => {}} onCancel={() => {}} />,
    );
    expect((lastFrame() ?? "").length).toBeGreaterThan(0);
  });

  it("advances frame when first step is submitted", async () => {
    const { lastFrame, stdin } = render(
      <InitFlow onComplete={() => {}} onCancel={() => {}} />,
    );
    const before = lastFrame();
    stdin.write("MyProject");
    await tick();
    stdin.write("\r");
    await tick();
    expect(lastFrame()).not.toBe(before);
  });

  it("advances progress for the project purpose question", async () => {
    const { lastFrame, stdin } = render(
      <InitFlow onComplete={() => {}} onCancel={() => {}} />,
    );

    expect(lastFrame()).toContain("1/8");

    stdin.write("MyProject");
    await tick();
    stdin.write("\r");
    await tick();

    expect(lastFrame()).toContain("Project purpose");
    expect(lastFrame()).toContain("2/8");
  });

  it("renders yes/no audience gate as a toggle", async () => {
    const { lastFrame, stdin } = render(
      <InitFlow onComplete={() => {}} onCancel={() => {}} />,
    );

    stdin.write("MyProject");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();

    expect(lastFrame()).toContain("Add an audience?");
    expect(lastFrame()).toContain("Yes");
    expect(lastFrame()).toContain("▸ No");
    expect(lastFrame()).toContain("3/8");
    expect(lastFrame()).not.toContain("1/1");
  });

  it("restores project details when backing from audience gate", async () => {
    const { lastFrame, stdin } = render(
      <InitFlow onComplete={() => {}} onCancel={() => {}} />,
    );

    stdin.write("MyProject");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Created from TUI");
    await tick();
    stdin.write("\r");
    await tick();

    expect(lastFrame()).toContain("Add an audience?");

    stdin.write("\x1B[D");
    await tick();

    expect(lastFrame()).toContain("Project purpose");
    expect(lastFrame()).toContain("Created from TUI");
    expect(lastFrame()).toContain("2/8");
  });

  it("renders audience priority as a single-select option list", async () => {
    const { lastFrame, stdin } = render(
      <InitFlow onComplete={() => {}} onCancel={() => {}} />,
    );

    stdin.write("MyProject");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write(" ");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Developers");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Software developers");
    await tick();
    stdin.write("\r");
    await tick();

    expect(lastFrame()).toContain("Audience priority");
    expect(lastFrame()).toContain("▸ (x) Primary");
    expect(lastFrame()).toContain("( ) Secondary");
    expect(lastFrame()).toContain("( ) Tertiary");
  });

  it("allows backing out after choosing to add an audience", async () => {
    const { lastFrame, stdin } = render(
      <InitFlow onComplete={() => {}} onCancel={() => {}} />,
    );

    stdin.write("MyProject");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write(" ");
    await tick();
    stdin.write("\r");
    await tick();

    expect(lastFrame()).toContain("Audience name");

    stdin.write("\x1B[D");
    await tick();

    expect(lastFrame()).toContain("Add an audience?");
    expect(lastFrame()).toContain("▸ No");
  });

  it("allows backing out after choosing to add a value proposition", async () => {
    const { lastFrame, stdin } = render(
      <InitFlow onComplete={() => {}} onCancel={() => {}} />,
    );

    stdin.write("MyProject");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write(" ");
    await tick();
    stdin.write("\r");
    await tick();

    expect(lastFrame()).toContain("Value proposition title");

    stdin.write("\x1B[D");
    await tick();

    expect(lastFrame()).toContain("Add a value proposition?");
    expect(lastFrame()).toContain("▸ No");
  });

  it("removes a submitted audience when backing across that fane boundary", async () => {
    const actionControllers = {
      planProjectInitController: {
        handle: jest.fn().mockResolvedValue({
          availableAgents: [],
          plannedChanges: [],
        }),
      },
      initializeProjectController: {
        handle: jest.fn().mockResolvedValue({
          projectId: "project_123",
          changes: [],
        }),
      },
      addAudienceController: {
        handle: jest.fn(),
      },
      addValuePropositionController: {
        handle: jest.fn(),
      },
    };
    const handleComplete = jest.fn();

    const { lastFrame, stdin } = render(
      <InitFlow
        actionControllers={actionControllers}
        onComplete={handleComplete}
        onCancel={() => {}}
      />,
    );

    stdin.write("MyProject");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write(" ");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Developers");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Software developers");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\x1B[D");
    await tick();
    stdin.write("\x1B[D");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Proceed with initialization?"),
    );

    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Project initialized successfully."),
    );
    await waitForMockCall(handleComplete);

    expect(actionControllers.addAudienceController.handle).not.toHaveBeenCalled();
    expect(handleComplete).toHaveBeenCalledWith(
      expect.objectContaining({ audienceCount: "0" }),
    );
  });

  it("removes a submitted value proposition when backing across that fane boundary", async () => {
    const actionControllers = {
      planProjectInitController: {
        handle: jest.fn().mockResolvedValue({
          availableAgents: [],
          plannedChanges: [],
        }),
      },
      initializeProjectController: {
        handle: jest.fn().mockResolvedValue({
          projectId: "project_123",
          changes: [],
        }),
      },
      addAudienceController: {
        handle: jest.fn(),
      },
      addValuePropositionController: {
        handle: jest.fn(),
      },
    };
    const handleComplete = jest.fn();

    const { lastFrame, stdin } = render(
      <InitFlow
        actionControllers={actionControllers}
        onComplete={handleComplete}
        onCancel={() => {}}
      />,
    );

    stdin.write("MyProject");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write(" ");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Persistent context");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Useful context");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Better agents");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();

    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Proceed with initialization?"),
    );

    stdin.write("\x1B[D");
    await tick();
    stdin.write("\x1B[D");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Proceed with initialization?"),
    );
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Project initialized successfully."),
    );
    await waitForMockCall(handleComplete);

    expect(
      actionControllers.addValuePropositionController.handle,
    ).not.toHaveBeenCalled();
    expect(handleComplete).toHaveBeenCalledWith(
      expect.objectContaining({ valuePropositionCount: "0" }),
    );
  });

  it("calls onCancel when escape is pressed", async () => {
    const handleCancel = jest.fn();
    const { lastFrame, stdin } = render(
      <InitFlow onComplete={() => {}} onCancel={handleCancel} />,
    );
    stdin.write("\x1b");
    await tick();
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it("plans, initializes, and persists collected primitives through action controllers", async () => {
    const actionControllers = {
      planProjectInitController: {
        handle: jest.fn().mockResolvedValue({
          availableAgents: [],
          plannedChanges: [],
        }),
      },
      initializeProjectController: {
        handle: jest.fn().mockResolvedValue({
          projectId: "project_123",
          changes: [],
        }),
      },
      addAudienceController: {
        handle: jest.fn().mockResolvedValue({
          audienceId: "aud_123",
          name: "Developers",
          description: "Software developers",
          priority: "primary",
        }),
      },
      addValuePropositionController: {
        handle: jest.fn().mockResolvedValue({
          valuePropositionId: "value_123",
          title: "Persistent context",
        }),
      },
    };
    const handleComplete = jest.fn();

    const { lastFrame, stdin } = render(
      <InitFlow
        actionControllers={actionControllers}
        onComplete={handleComplete}
        onCancel={() => {}}
      />,
    );

    stdin.write("MyProject");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Project purpose");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write(" ");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Developers");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Software developers");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write(" ");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Persistent context");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Keep context across sessions");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("No context loss");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();

    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Proceed with initialization?"),
    );

    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Project initialized successfully."),
    );
    await waitForMockCall(actionControllers.initializeProjectController.handle);
    await waitForMockCall(handleComplete);

    expect(actionControllers.planProjectInitController.handle).toHaveBeenCalledWith({
      projectRoot: process.cwd(),
      selectedAgentIds: undefined,
    });
    expect(actionControllers.initializeProjectController.handle).toHaveBeenCalledWith({
      name: "MyProject",
      purpose: "Project purpose",
      projectRoot: process.cwd(),
      selectedAgentIds: undefined,
    });
    expect(actionControllers.addAudienceController.handle).toHaveBeenCalledWith({
      name: "Developers",
      description: "Software developers",
      priority: "primary",
    });
    expect(
      actionControllers.addValuePropositionController.handle,
    ).toHaveBeenCalledWith({
      title: "Persistent context",
      description: "Keep context across sessions",
      benefit: "No context loss",
      measurableOutcome: undefined,
    });
    expect(handleComplete).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: "project_123" }),
    );
  });

  it("shows dispatch errors inline without closing the flow", async () => {
    const actionControllers = {
      planProjectInitController: {
        handle: jest.fn().mockRejectedValue(new Error("Planning failed")),
      },
    };
    const handleComplete = jest.fn();

    const { lastFrame, stdin } = render(
      <InitFlow
        actionControllers={actionControllers}
        onComplete={handleComplete}
        onCancel={() => {}}
      />,
    );

    stdin.write("MyProject");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("no");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("no");
    await tick();
    stdin.write("\r");
    await tick();

    expect(lastFrame()).toContain("Planning failed");
    expect(handleComplete).not.toHaveBeenCalled();
  });

  it("summarizes planned files on confirmation and opens detailed review with v", async () => {
    const actionControllers = {
      planProjectInitController: {
        handle: jest.fn().mockResolvedValue({
          availableAgents: [],
          plannedChanges: [
            {
              action: "create",
              path: "JUMBO.md",
              description: "Add Jumbo instructions",
            },
            {
              action: "create",
              path: ".claude/settings.json",
              description: "Add hook configuration and permissions",
            },
            {
              action: "modify",
              path: ".gitignore",
              description: "Ignore Jumbo state",
            },
          ],
        }),
      },
      initializeProjectController: {
        handle: jest.fn().mockResolvedValue({
          projectId: "project_123",
          changes: [],
        }),
      },
    };

    const { lastFrame, stdin } = render(
      <InitFlow
        actionControllers={actionControllers}
        onComplete={() => {}}
        onCancel={() => {}}
      />,
    );

    stdin.write("MyProject");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();

    expect(lastFrame()).toContain("Planned changes");
    expect(lastFrame()).toContain("Create: 2 files");
    expect(lastFrame()).toContain("Modify: 1 files");
    expect(lastFrame()).toContain("Existing content is preserved.");
    expect(lastFrame()).toContain("v");
    expect(lastFrame()).toContain("View files");
    expect(lastFrame()).not.toContain(".claude/settings.json");

    stdin.write("v");
    await tick();

    expect(lastFrame()).toContain("Files 1-3 of 3");
    expect(lastFrame()).toContain("create: .claude/settings.json");
    expect(lastFrame()).toContain("modify: .gitignore");
    expect(lastFrame()).toContain("Summary");
  });

  it("shows an inline error when required initialization controllers are missing", async () => {
    const handleComplete = jest.fn();

    const { lastFrame, stdin } = render(
      <InitFlow onComplete={handleComplete} onCancel={() => {}} />,
    );

    stdin.write("MyProject");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();

    expect(lastFrame()).toContain("Project initialization planning is unavailable");
    expect(handleComplete).not.toHaveBeenCalled();
  });

  it("initializes project state and project files through the real composed controllers", async () => {
    const projectRoot = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), "jumbo-tui-init-")),
    );
    tempDirs.push(projectRoot);
    process.chdir(projectRoot);

    const host = new Host(path.join(projectRoot, ".jumbo"));
    const container = await host.createBuilder().build();
    const handleComplete = jest.fn();

    const { lastFrame, stdin, unmount } = render(
      <InitFlow
        actionControllers={{
          planProjectInitController: container.planProjectInitController,
          initializeProjectController: container.initializeProjectController,
          addAudienceController: container.addAudienceController,
          addValuePropositionController:
            container.addValuePropositionController,
        }}
        onComplete={handleComplete}
        onCancel={() => {}}
      />,
    );

    stdin.write("TuiProject");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("Created from TUI");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();

    await waitForFrame(lastFrame, (frame) => frame.includes("Agents"));

    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Proceed with initialization?"),
    );

    try {
      stdin.write("\r");
      await waitForFrame(
        lastFrame,
        (frame) => frame.includes("Project initialized successfully."),
        15000,
      );
      await waitForMockCall(handleComplete);

      expect(handleComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: expect.any(String),
          projectName: "TuiProject",
        }),
      );
      await expect(fs.pathExists(path.join(projectRoot, ".jumbo"))).resolves.toBe(
        true,
      );
      await expect(fs.pathExists(path.join(projectRoot, "JUMBO.md"))).resolves.toBe(
        true,
      );
      await expect(fs.pathExists(path.join(projectRoot, "AGENTS.md"))).resolves.toBe(
        true,
      );
      await expect(
        fs.pathExists(path.join(projectRoot, ".gitignore")),
      ).resolves.toBe(true);
      await expect(container.projectContextReader.getProject()).resolves.toEqual(
        expect.objectContaining({ name: "TuiProject" }),
      );
    } finally {
      unmount();
      host.dispose();
    }
  }, 30000);

  it("allows optional audience and value proposition collection to be skipped with enter", async () => {
    const actionControllers = {
      planProjectInitController: {
        handle: jest.fn().mockResolvedValue({
          availableAgents: [],
          plannedChanges: [],
        }),
      },
      initializeProjectController: {
        handle: jest.fn().mockResolvedValue({
          projectId: "project_123",
          changes: [],
        }),
      },
      addAudienceController: {
        handle: jest.fn(),
      },
      addValuePropositionController: {
        handle: jest.fn(),
      },
    };
    const handleComplete = jest.fn();

    const { lastFrame, stdin } = render(
      <InitFlow
        actionControllers={actionControllers}
        onComplete={handleComplete}
        onCancel={() => {}}
      />,
    );

    stdin.write("MyProject");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Proceed with initialization?"),
    );
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Project initialized successfully."),
    );
    await waitForMockCall(actionControllers.initializeProjectController.handle);
    await waitForMockCall(handleComplete);

    expect(actionControllers.planProjectInitController.handle).toHaveBeenCalledWith({
      projectRoot: process.cwd(),
      selectedAgentIds: undefined,
    });
    expect(actionControllers.initializeProjectController.handle).toHaveBeenCalledWith({
      name: "MyProject",
      purpose: undefined,
      projectRoot: process.cwd(),
      selectedAgentIds: undefined,
    });
    expect(actionControllers.addAudienceController.handle).not.toHaveBeenCalled();
    expect(
      actionControllers.addValuePropositionController.handle,
    ).not.toHaveBeenCalled();
    expect(handleComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        audienceCount: "0",
        valuePropositionCount: "0",
      }),
    );
  }, 10000);

  it("defaults empty agent selection to all available agents before initialization", async () => {
    const availableAgents = [
      { id: "claude", name: "Claude" },
      { id: "codex", name: "Codex" },
    ] as const;
    const actionControllers = {
      planProjectInitController: {
        handle: jest.fn().mockResolvedValue({
          availableAgents,
          plannedChanges: [],
        }),
      },
      initializeProjectController: {
        handle: jest.fn().mockResolvedValue({
          projectId: "project_123",
          changes: [],
        }),
      },
    };

    const { lastFrame, stdin } = render(
      <InitFlow
        actionControllers={actionControllers}
        onComplete={() => {}}
        onCancel={() => {}}
      />,
    );

    stdin.write("MyProject");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) => frame.includes("Agents"));
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Proceed with initialization?"),
    );
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Project initialized successfully."),
    );
    await waitForMockCall(actionControllers.initializeProjectController.handle);

    expect(actionControllers.planProjectInitController.handle).toHaveBeenNthCalledWith(2, {
      projectRoot: process.cwd(),
      selectedAgentIds: ["claude", "codex"],
    });
    expect(actionControllers.initializeProjectController.handle).toHaveBeenCalledWith({
      name: "MyProject",
      purpose: undefined,
      projectRoot: process.cwd(),
      selectedAgentIds: ["claude", "codex"],
    });
  }, 10000);

  it("allows available agents to be toggled before initialization", async () => {
    const availableAgents = [
      { id: "claude", name: "Claude" },
      { id: "codex", name: "Codex" },
    ] as const;
    const actionControllers = {
      planProjectInitController: {
        handle: jest.fn().mockResolvedValue({
          availableAgents,
          plannedChanges: [],
        }),
      },
      initializeProjectController: {
        handle: jest.fn().mockResolvedValue({
          projectId: "project_123",
          changes: [],
        }),
      },
    };

    const { lastFrame, stdin } = render(
      <InitFlow
        actionControllers={actionControllers}
        onComplete={() => {}}
        onCancel={() => {}}
      />,
    );

    stdin.write("MyProject");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();
    stdin.write("\r");
    await tick();

    await waitForFrame(lastFrame, (frame) => frame.includes("Agents"));
    expect(lastFrame()).toContain("Agents");
    expect(lastFrame()).toContain("▸ [x] Claude (claude)");
    expect(lastFrame()).toContain("[x] Codex (codex)");
    expect(lastFrame()).toContain("7/8");
    expect(lastFrame()).not.toContain("1/1");

    stdin.write(" ");
    await tick();
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Proceed with initialization?"),
    );
    stdin.write("\r");
    await waitForFrame(lastFrame, (frame) =>
      frame.includes("Project initialized successfully."),
    );
    await waitForMockCall(actionControllers.initializeProjectController.handle);

    expect(actionControllers.planProjectInitController.handle).toHaveBeenNthCalledWith(2, {
      projectRoot: process.cwd(),
      selectedAgentIds: ["codex"],
    });
    expect(actionControllers.initializeProjectController.handle).toHaveBeenCalledWith({
      name: "MyProject",
      purpose: undefined,
      projectRoot: process.cwd(),
      selectedAgentIds: ["codex"],
    });
  });
});
