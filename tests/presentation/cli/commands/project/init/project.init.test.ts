import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

jest.unstable_mockModule("inquirer", () => ({
  default: { prompt: jest.fn() },
}));

jest.unstable_mockModule("../../../../../../src/presentation/cli/banner/AnimatedBanner.js", () => ({
  getBannerLines: jest.fn(() => ["Jumbo"]),
  showAnimatedBanner: jest.fn().mockResolvedValue(undefined),
}));

const { default: inquirer } = await import("inquirer");
const { projectInit } = await import("../../../../../../src/presentation/cli/commands/project/init/project.init.js");
import type { IApplicationContainer } from "../../../../../../src/application/host/IApplicationContainer.js";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer.js";

describe("project.init command", () => {
  const availableAgents = [
    { id: "claude", name: "Claude" },
    { id: "gemini", name: "Gemini" },
    { id: "copilot", name: "Copilot" },
  ] as const;
  let mockContainer: Partial<IApplicationContainer>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let isTtyDescriptor: PropertyDescriptor | undefined;

  function createMockContainer(
    telemetryStatusOverrides: Record<string, unknown> = {}
  ): Partial<IApplicationContainer> {
    return {
      cliVersionReader: {
        getVersion: jest.fn().mockReturnValue({ version: "1.0.1" }),
      } as any,
      getTelemetryStatusController: {
        handle: jest.fn().mockResolvedValue({
          configured: false,
          enabled: false,
          effectiveEnabled: false,
          anonymousId: null,
          disabledByCi: false,
          disabledByEnvironment: false,
          ...telemetryStatusOverrides,
        }),
      } as any,
      updateTelemetryConsentController: {
        handle: jest.fn().mockResolvedValue({
          enabled: true,
          effectiveEnabled: true,
          anonymousId: "anon-123",
          disabledByCi: false,
          disabledByEnvironment: false,
          generatedAnonymousId: true,
        }),
      } as any,
      planProjectInitController: {
        handle: jest.fn().mockResolvedValue({
          availableAgents,
          plannedChanges: [],
        }),
      } as any,
      initializeProjectController: {
        handle: jest.fn().mockResolvedValue({
          projectId: "project_123",
          changes: [],
        }),
      } as any,
      addAudienceController: {
        handle: jest.fn().mockResolvedValue({
          audienceId: "aud_123",
          name: "Developers",
          description: "Software developers",
          priority: "primary",
        }),
      } as any,
      addAudiencePainController: {
        handle: jest.fn().mockResolvedValue({
          painId: "pain_123",
          title: "Context loss",
          description: "LLMs lose context",
          version: 1,
        }),
      } as any,
      addValuePropositionController: {
        handle: jest.fn().mockResolvedValue({
          valuePropositionId: "vp_123",
          title: "Persistent context",
          measurableOutcome: undefined,
        }),
      } as any,
    };
  }

  /**
   * In interactive mode the prompt sequence is:
   * 1. Project details (name, purpose)
   * 2. Audience confirm gate
   * 3. (If yes: audience fields, then "Add another?" confirm)
   * 4. Pain confirm gate
   * 5. (If yes: pain fields, then "Add another?" confirm)
   * 6. Value confirm gate
   * 7. (If yes: value fields, then "Add another?" confirm)
   * 8. Telemetry consent
   * 9. Agent selection
   */
  function mockInteractiveSkipAllPrimitives(
    projectOverrides: Record<string, unknown> = {},
    telemetryAnswer: Record<string, unknown> = { enabled: true },
    agentSelectionAnswer: Record<string, unknown> = { selectedAgentIds: availableAgents.map((agent) => agent.id) }
  ) {
    const promptMock = inquirer.prompt as jest.Mock;
    promptMock
      .mockResolvedValueOnce({ name: "TestProject", ...projectOverrides }) // project details
      .mockResolvedValueOnce({ defineAudience: false })    // skip audiences
      .mockResolvedValueOnce({ definePain: false })         // skip pains
      .mockResolvedValueOnce({ defineValue: false })        // skip values
      .mockResolvedValueOnce(telemetryAnswer)               // telemetry
      .mockResolvedValueOnce(agentSelectionAnswer);         // agents
  }

  beforeEach(() => {
    (inquirer.prompt as jest.Mock).mockReset();

    mockContainer = createMockContainer();

    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    Renderer.reset();

    isTtyDescriptor = Object.getOwnPropertyDescriptor(process.stdout, "isTTY");
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    Renderer.reset();

    if (isTtyDescriptor) {
      Object.defineProperty(process.stdout, "isTTY", isTtyDescriptor);
    }
  });

  describe("telemetry", () => {
    it("collects telemetry consent during interactive init", async () => {
      mockInteractiveSkipAllPrimitives(
        { name: "Jumbo", purpose: "Telemetry" },
        { enabled: true }
      );

      await projectInit({ yolo: true }, mockContainer as IApplicationContainer);

      expect(
        mockContainer.getTelemetryStatusController!.handle
      ).toHaveBeenCalledWith({});
      expect(
        mockContainer.updateTelemetryConsentController!.handle
      ).toHaveBeenCalledWith({ enabled: true });
    });

    it("accepting default enables telemetry with opt-out framing", async () => {
      mockInteractiveSkipAllPrimitives({}, { enabled: true });

      await projectInit({ yolo: true }, mockContainer as IApplicationContainer);

      expect(
        mockContainer.updateTelemetryConsentController!.handle
      ).toHaveBeenCalledWith({ enabled: true });
    });

    it("declining disables telemetry", async () => {
      mockInteractiveSkipAllPrimitives({}, { enabled: false });

      await projectInit({ yolo: true }, mockContainer as IApplicationContainer);

      expect(
        mockContainer.updateTelemetryConsentController!.handle
      ).toHaveBeenCalledWith({ enabled: false });
    });

    it("enables telemetry by default in non-interactive mode without prompting", async () => {
      const promptMock = inquirer.prompt as jest.Mock;

      await projectInit(
        {
          nonInteractive: true,
          yolo: true,
          name: "Jumbo",
        },
        mockContainer as IApplicationContainer
      );

      expect(promptMock).not.toHaveBeenCalled();
      expect(
        mockContainer.updateTelemetryConsentController!.handle
      ).toHaveBeenCalledWith({ enabled: true });
    });

    it("skips telemetry prompt when CI is detected", async () => {
      mockContainer = createMockContainer({ disabledByCi: true });

      const promptMock = inquirer.prompt as jest.Mock;
      promptMock
        .mockResolvedValueOnce({ name: "TestProject" })
        .mockResolvedValueOnce({ defineAudience: false })
        .mockResolvedValueOnce({ definePain: false })
        .mockResolvedValueOnce({ defineValue: false })
        .mockResolvedValueOnce({ selectedAgentIds: ["claude"] });

      await projectInit({ yolo: true }, mockContainer as IApplicationContainer);

      expect(
        mockContainer.updateTelemetryConsentController!.handle
      ).not.toHaveBeenCalled();
    });

    it("skips telemetry prompt when JUMBO_TELEMETRY_DISABLED=1 is set", async () => {
      mockContainer = createMockContainer({ disabledByEnvironment: true });

      const promptMock = inquirer.prompt as jest.Mock;
      promptMock
        .mockResolvedValueOnce({ name: "TestProject" })
        .mockResolvedValueOnce({ defineAudience: false })
        .mockResolvedValueOnce({ definePain: false })
        .mockResolvedValueOnce({ defineValue: false })
        .mockResolvedValueOnce({ selectedAgentIds: ["claude"] });

      await projectInit({ yolo: true }, mockContainer as IApplicationContainer);

      expect(
        mockContainer.updateTelemetryConsentController!.handle
      ).not.toHaveBeenCalled();
    });

    it("skips telemetry prompt when already configured", async () => {
      mockContainer = createMockContainer({ configured: true });

      const promptMock = inquirer.prompt as jest.Mock;
      promptMock
        .mockResolvedValueOnce({ name: "TestProject" })
        .mockResolvedValueOnce({ defineAudience: false })
        .mockResolvedValueOnce({ definePain: false })
        .mockResolvedValueOnce({ defineValue: false })
        .mockResolvedValueOnce({ selectedAgentIds: ["claude"] });

      await projectInit({ yolo: true }, mockContainer as IApplicationContainer);

      expect(
        mockContainer.updateTelemetryConsentController!.handle
      ).not.toHaveBeenCalled();
    });
  });

  describe("interactive primitive prompts", () => {
    it("prompts for audience, pain, and value when user accepts each gate", async () => {
      const promptMock = inquirer.prompt as jest.Mock;
      promptMock
        .mockResolvedValueOnce({ name: "TestProject" })                      // project details
        .mockResolvedValueOnce({ defineAudience: true })                     // audience gate
        .mockResolvedValueOnce({ name: "Devs", description: "Software developers", priority: "primary" }) // audience fields
        .mockResolvedValueOnce({ another: false })                           // no more audiences
        .mockResolvedValueOnce({ definePain: true })                         // pain gate
        .mockResolvedValueOnce({ title: "Context loss", description: "LLMs lose context" }) // pain fields
        .mockResolvedValueOnce({ another: false })                           // no more pains
        .mockResolvedValueOnce({ defineValue: true })                        // value gate
        .mockResolvedValueOnce({ title: "Persistent", description: "Keep context", benefit: "No loss", measurableOutcome: "" }) // value fields
        .mockResolvedValueOnce({ another: false })                           // no more values
        .mockResolvedValueOnce({ enabled: true })                            // telemetry
        .mockResolvedValueOnce({ selectedAgentIds: ["claude", "copilot"] }); // agents

      await projectInit({ yolo: true }, mockContainer as IApplicationContainer);

      expect(mockContainer.addAudienceController!.handle).toHaveBeenCalledWith({
        name: "Devs",
        description: "Software developers",
        priority: "primary",
      });
      expect(mockContainer.addAudiencePainController!.handle).toHaveBeenCalledWith({
        title: "Context loss",
        description: "LLMs lose context",
      });
      expect(mockContainer.addValuePropositionController!.handle).toHaveBeenCalledWith({
        title: "Persistent",
        description: "Keep context",
        benefit: "No loss",
        measurableOutcome: undefined,
      });
    });

    it("skips primitives when user declines each gate", async () => {
      mockInteractiveSkipAllPrimitives();

      await projectInit({ yolo: true }, mockContainer as IApplicationContainer);

      expect(mockContainer.addAudienceController!.handle).not.toHaveBeenCalled();
      expect(mockContainer.addAudiencePainController!.handle).not.toHaveBeenCalled();
      expect(mockContainer.addValuePropositionController!.handle).not.toHaveBeenCalled();
    });

    it("allows adding multiple audiences via the loop", async () => {
      const promptMock = inquirer.prompt as jest.Mock;
      promptMock
        .mockResolvedValueOnce({ name: "TestProject" })
        .mockResolvedValueOnce({ defineAudience: true })
        .mockResolvedValueOnce({ name: "Devs", description: "Developers", priority: "primary" })
        .mockResolvedValueOnce({ another: true })                            // add another
        .mockResolvedValueOnce({ name: "PMs", description: "Product managers", priority: "secondary" })
        .mockResolvedValueOnce({ another: false })                           // done
        .mockResolvedValueOnce({ definePain: false })
        .mockResolvedValueOnce({ defineValue: false })
        .mockResolvedValueOnce({ enabled: true })
        .mockResolvedValueOnce({ selectedAgentIds: ["claude"] });

      await projectInit({ yolo: true }, mockContainer as IApplicationContainer);

      expect(mockContainer.addAudienceController!.handle).toHaveBeenCalledTimes(2);
      expect(mockContainer.addAudienceController!.handle).toHaveBeenCalledWith({
        name: "Devs",
        description: "Developers",
        priority: "primary",
      });
      expect(mockContainer.addAudienceController!.handle).toHaveBeenCalledWith({
        name: "PMs",
        description: "Product managers",
        priority: "secondary",
      });
    });

    it("allows adding multiple pain points via the loop", async () => {
      const promptMock = inquirer.prompt as jest.Mock;
      promptMock
        .mockResolvedValueOnce({ name: "TestProject" })
        .mockResolvedValueOnce({ defineAudience: false })
        .mockResolvedValueOnce({ definePain: true })
        .mockResolvedValueOnce({ title: "Pain A", description: "Desc A" })
        .mockResolvedValueOnce({ another: true })
        .mockResolvedValueOnce({ title: "Pain B", description: "Desc B" })
        .mockResolvedValueOnce({ another: false })
        .mockResolvedValueOnce({ defineValue: false })
        .mockResolvedValueOnce({ enabled: true })
        .mockResolvedValueOnce({ selectedAgentIds: ["claude"] });

      await projectInit({ yolo: true }, mockContainer as IApplicationContainer);

      expect(mockContainer.addAudiencePainController!.handle).toHaveBeenCalledTimes(2);
    });

    it("allows adding multiple value propositions via the loop", async () => {
      const promptMock = inquirer.prompt as jest.Mock;
      promptMock
        .mockResolvedValueOnce({ name: "TestProject" })
        .mockResolvedValueOnce({ defineAudience: false })
        .mockResolvedValueOnce({ definePain: false })
        .mockResolvedValueOnce({ defineValue: true })
        .mockResolvedValueOnce({ title: "V1", description: "D1", benefit: "B1", measurableOutcome: "" })
        .mockResolvedValueOnce({ another: true })
        .mockResolvedValueOnce({ title: "V2", description: "D2", benefit: "B2", measurableOutcome: "M2" })
        .mockResolvedValueOnce({ another: false })
        .mockResolvedValueOnce({ enabled: true })
        .mockResolvedValueOnce({ selectedAgentIds: ["claude"] });

      await projectInit({ yolo: true }, mockContainer as IApplicationContainer);

      expect(mockContainer.addValuePropositionController!.handle).toHaveBeenCalledTimes(2);
      expect(mockContainer.addValuePropositionController!.handle).toHaveBeenCalledWith({
        title: "V2",
        description: "D2",
        benefit: "B2",
        measurableOutcome: "M2",
      });
    });
  });

  describe("non-interactive primitive flags", () => {
    it("skips the agent checkbox and initializes all agents in non-interactive mode", async () => {
      await projectInit(
        {
          nonInteractive: true,
          yolo: true,
          name: "TestProject",
        },
        mockContainer as IApplicationContainer
      );

      expect(mockContainer.planProjectInitController!.handle).toHaveBeenCalledTimes(1);
      expect(mockContainer.planProjectInitController!.handle).toHaveBeenCalledWith({
        projectRoot: process.cwd(),
      });
      expect(mockContainer.initializeProjectController!.handle).toHaveBeenCalledWith({
        name: "TestProject",
        purpose: undefined,
        projectRoot: process.cwd(),
        selectedAgentIds: undefined,
      });
    });

    it("persists audience from CLI flags in non-interactive mode", async () => {
      await projectInit(
        {
          nonInteractive: true,
          yolo: true,
          name: "TestProject",
          audienceName: "Devs",
          audienceDescription: "Software developers",
          audiencePriority: "primary",
        },
        mockContainer as IApplicationContainer
      );

      expect(mockContainer.addAudienceController!.handle).toHaveBeenCalledWith({
        name: "Devs",
        description: "Software developers",
        priority: "primary",
      });
    });

    it("persists pain from CLI flags in non-interactive mode", async () => {
      await projectInit(
        {
          nonInteractive: true,
          yolo: true,
          name: "TestProject",
          painTitle: "Context loss",
          painDescription: "LLMs lose context",
        },
        mockContainer as IApplicationContainer
      );

      expect(mockContainer.addAudiencePainController!.handle).toHaveBeenCalledWith({
        title: "Context loss",
        description: "LLMs lose context",
      });
    });

    it("persists value proposition from CLI flags in non-interactive mode", async () => {
      await projectInit(
        {
          nonInteractive: true,
          yolo: true,
          name: "TestProject",
          valueTitle: "Persistent context",
          valueDescription: "Keep context across sessions",
          valueBenefit: "No context loss",
          valueMeasurableOutcome: "Zero loss",
        },
        mockContainer as IApplicationContainer
      );

      expect(mockContainer.addValuePropositionController!.handle).toHaveBeenCalledWith({
        title: "Persistent context",
        description: "Keep context across sessions",
        benefit: "No context loss",
        measurableOutcome: "Zero loss",
      });
    });

    it("skips primitives when partial flags are provided in non-interactive mode", async () => {
      await projectInit(
        {
          nonInteractive: true,
          yolo: true,
          name: "TestProject",
          audienceName: "Devs",
          // missing audienceDescription and audiencePriority
        },
        mockContainer as IApplicationContainer
      );

      expect(mockContainer.addAudienceController!.handle).not.toHaveBeenCalled();
    });
  });

  describe("success output", () => {
    it("filters planned changes and initialization to the selected agents", async () => {
      mockInteractiveSkipAllPrimitives(
        {},
        { enabled: true },
        { selectedAgentIds: ["gemini", "copilot"] }
      );

      await projectInit({ yolo: true }, mockContainer as IApplicationContainer);

      expect(mockContainer.planProjectInitController!.handle).toHaveBeenNthCalledWith(1, {
        projectRoot: process.cwd(),
      });
      expect(mockContainer.planProjectInitController!.handle).toHaveBeenNthCalledWith(2, {
        projectRoot: process.cwd(),
        selectedAgentIds: ["gemini", "copilot"],
      });
      expect(mockContainer.initializeProjectController!.handle).toHaveBeenCalledWith({
        name: "TestProject",
        purpose: undefined,
        projectRoot: process.cwd(),
        selectedAgentIds: ["gemini", "copilot"],
      });
    });

    it("lists registered primitives in success output", async () => {
      const promptMock = inquirer.prompt as jest.Mock;
      promptMock
        .mockResolvedValueOnce({ name: "TestProject" })
        .mockResolvedValueOnce({ defineAudience: true })
        .mockResolvedValueOnce({ name: "Devs", description: "Developers", priority: "primary" })
        .mockResolvedValueOnce({ another: false })
        .mockResolvedValueOnce({ definePain: false })
        .mockResolvedValueOnce({ defineValue: false })
        .mockResolvedValueOnce({ enabled: true })
        .mockResolvedValueOnce({ selectedAgentIds: ["claude"] });

      await projectInit({ yolo: true }, mockContainer as IApplicationContainer);

      const loggedText = consoleLogSpy.mock.calls.map((c) => String(c[0])).join("\n");
      expect(loggedText).toContain("Registered Audience: Devs");
    });

    it("suggests skipped primitives in next steps", async () => {
      mockInteractiveSkipAllPrimitives();

      await projectInit({ yolo: true }, mockContainer as IApplicationContainer);

      const loggedText = consoleLogSpy.mock.calls.map((c) => String(c[0])).join("\n");
      expect(loggedText).toContain("jumbo audience add");
      expect(loggedText).toContain("jumbo audience-pain add");
      expect(loggedText).toContain("jumbo value add");
    });

    it("omits suggestion for primitives that were provided", async () => {
      const promptMock = inquirer.prompt as jest.Mock;
      promptMock
        .mockResolvedValueOnce({ name: "TestProject" })
        .mockResolvedValueOnce({ defineAudience: true })
        .mockResolvedValueOnce({ name: "Devs", description: "Developers", priority: "primary" })
        .mockResolvedValueOnce({ another: false })
        .mockResolvedValueOnce({ definePain: true })
        .mockResolvedValueOnce({ title: "Pain", description: "Desc" })
        .mockResolvedValueOnce({ another: false })
        .mockResolvedValueOnce({ defineValue: true })
        .mockResolvedValueOnce({ title: "Val", description: "Desc", benefit: "Ben", measurableOutcome: "" })
        .mockResolvedValueOnce({ another: false })
        .mockResolvedValueOnce({ enabled: true })
        .mockResolvedValueOnce({ selectedAgentIds: ["claude"] });

      await projectInit({ yolo: true }, mockContainer as IApplicationContainer);

      const loggedText = consoleLogSpy.mock.calls.map((c) => String(c[0])).join("\n");
      expect(loggedText).not.toContain("jumbo audience add");
      expect(loggedText).not.toContain("jumbo audience-pain add");
      expect(loggedText).not.toContain("jumbo value add");
    });
  });
});
