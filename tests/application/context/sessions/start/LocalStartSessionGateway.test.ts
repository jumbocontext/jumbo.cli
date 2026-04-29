import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalStartSessionGateway } from "../../../../../src/application/context/sessions/start/LocalStartSessionGateway.js";
import { SessionContextQueryHandler } from "../../../../../src/application/context/sessions/get/SessionContextQueryHandler.js";
import { StartSessionCommandHandler } from "../../../../../src/application/context/sessions/start/StartSessionCommandHandler.js";
import { IBrownfieldStatusReader } from "../../../../../src/application/context/sessions/start/IBrownfieldStatusReader.js";
import { IArchitectureReader } from "../../../../../src/application/context/architecture/IArchitectureReader.js";
import { ContextualSessionView } from "../../../../../src/application/context/sessions/get/ContextualSessionView.js";
import { GoalView } from "../../../../../src/application/context/goals/GoalView.js";
import { SessionInstructionSignal } from "../../../../../src/application/context/sessions/SessionInstructionSignal.js";

describe("LocalStartSessionGateway", () => {
  let sessionContextQueryHandler: jest.Mocked<SessionContextQueryHandler>;
  let startSessionCommandHandler: jest.Mocked<StartSessionCommandHandler>;
  let brownfieldStatusReader: jest.Mocked<IBrownfieldStatusReader>;
  let gateway: LocalStartSessionGateway;

  function createBaseContextView(
    overrides: Partial<ContextualSessionView> = {}
  ): ContextualSessionView {
    return {
      session: null,
      context: {
        projectContext: null,
        activeGoals: [],
        pausedGoals: [],
        plannedGoals: [],
        recentDecisions: [],
      },
      ...overrides,
    };
  }

  beforeEach(() => {
    sessionContextQueryHandler = {
      execute: jest.fn().mockResolvedValue(createBaseContextView()),
    } as unknown as jest.Mocked<SessionContextQueryHandler>;

    startSessionCommandHandler = {
      execute: jest.fn().mockResolvedValue({ sessionId: "session_test-123" }),
    } as unknown as jest.Mocked<StartSessionCommandHandler>;

    brownfieldStatusReader = {
      isUnprimed: jest.fn().mockResolvedValue(false),
    } as jest.Mocked<IBrownfieldStatusReader>;

    gateway = new LocalStartSessionGateway(
      sessionContextQueryHandler,
      startSessionCommandHandler,
      brownfieldStatusReader,
    );
  });

  it("should return enriched context with session ID", async () => {
    const result = await gateway.startSession({});

    expect(result.sessionId).toBe("session_test-123");
    expect(result.context.scope).toBe("session-start");
    expect(result.context.session).toBeNull();
  });

  it("should call sessionContextQueryHandler to assemble base context", async () => {
    await gateway.startSession({});

    expect(sessionContextQueryHandler.execute).toHaveBeenCalledTimes(1);
  });

  it("should call startSessionCommandHandler to create session", async () => {
    await gateway.startSession({});

    expect(startSessionCommandHandler.execute).toHaveBeenCalledTimes(1);
    expect(startSessionCommandHandler.execute).toHaveBeenCalledWith({});
  });

  it("should check brownfield status via qualifier", async () => {
    await gateway.startSession({});

    expect(brownfieldStatusReader.isUnprimed).toHaveBeenCalledTimes(1);
  });

  describe("instruction building", () => {
    it("should always include goal-selection-prompt instruction", async () => {
      const result = await gateway.startSession({});

      expect(result.context.instructions).toContain(SessionInstructionSignal.GOAL_SELECTION_PROMPT);
    });

    it("should include brownfield-onboarding when project is unprimed", async () => {
      brownfieldStatusReader.isUnprimed.mockResolvedValue(true);

      const result = await gateway.startSession({});

      expect(result.context.instructions).toContain(SessionInstructionSignal.BROWNFIELD_ONBOARDING);
    });

    it("should not include brownfield-onboarding when project is primed", async () => {
      brownfieldStatusReader.isUnprimed.mockResolvedValue(false);

      const result = await gateway.startSession({});

      expect(result.context.instructions).not.toContain(SessionInstructionSignal.BROWNFIELD_ONBOARDING);
    });

    it("should include paused-goals-resume when paused goals exist", async () => {
      const contextView = createBaseContextView({
        context: {
          projectContext: null,
          activeGoals: [],
          pausedGoals: [{ goalId: "g1", objective: "Paused task", status: "paused" } as GoalView],
          plannedGoals: [],
          recentDecisions: [],
        },
      });
      sessionContextQueryHandler.execute.mockResolvedValue(contextView);

      const result = await gateway.startSession({});

      expect(result.context.instructions).toContain(SessionInstructionSignal.PAUSED_GOALS_RESUME);
    });

    it("should not include paused-goals-resume when no paused goals", async () => {
      const result = await gateway.startSession({});

      expect(result.context.instructions).not.toContain(SessionInstructionSignal.PAUSED_GOALS_RESUME);
    });

    it("should include all instructions when brownfield with paused goals", async () => {
      brownfieldStatusReader.isUnprimed.mockResolvedValue(true);
      const contextView = createBaseContextView({
        context: {
          projectContext: null,
          activeGoals: [],
          pausedGoals: [{ goalId: "g1", objective: "Paused", status: "paused" } as GoalView],
          plannedGoals: [],
          recentDecisions: [],
        },
      });
      sessionContextQueryHandler.execute.mockResolvedValue(contextView);

      const result = await gateway.startSession({});

      expect(result.context.instructions).toEqual([
        SessionInstructionSignal.BROWNFIELD_ONBOARDING,
        SessionInstructionSignal.PAUSED_GOALS_RESUME,
        SessionInstructionSignal.GOAL_SELECTION_PROMPT,
      ]);
    });

    it("should include primitive-gaps-detected when project context has empty primitive catalogs", async () => {
      const contextView = createBaseContextView({
        context: {
          projectContext: {
            project: { name: "Test", purpose: "Testing" },
            audiences: [],
            audiencePains: [],
            valuePropositions: [],
          } as any,
          activeGoals: [],
          pausedGoals: [],
          plannedGoals: [],
          recentDecisions: [],
        },
      });
      sessionContextQueryHandler.execute.mockResolvedValue(contextView);

      const result = await gateway.startSession({});

      expect(result.context.instructions).toContain(SessionInstructionSignal.PRIMITIVE_GAPS_DETECTED);
    });

    it("should not include primitive-gaps-detected when all primitive catalogs have entries", async () => {
      const contextView = createBaseContextView({
        context: {
          projectContext: {
            project: { name: "Test", purpose: "Testing" },
            audiences: [{ name: "Devs" }],
            audiencePains: [{ title: "Pain" }],
            valuePropositions: [{ title: "VP" }],
          } as any,
          activeGoals: [],
          pausedGoals: [],
          plannedGoals: [],
          recentDecisions: [],
        },
      });
      sessionContextQueryHandler.execute.mockResolvedValue(contextView);

      const result = await gateway.startSession({});

      expect(result.context.instructions).not.toContain(SessionInstructionSignal.PRIMITIVE_GAPS_DETECTED);
    });

    it("should not include primitive-gaps-detected during brownfield onboarding", async () => {
      brownfieldStatusReader.isUnprimed.mockResolvedValue(true);
      const contextView = createBaseContextView({
        context: {
          projectContext: {
            project: { name: "Test", purpose: "Testing" },
            audiences: [],
            audiencePains: [],
            valuePropositions: [],
          } as any,
          activeGoals: [],
          pausedGoals: [],
          plannedGoals: [],
          recentDecisions: [],
        },
      });
      sessionContextQueryHandler.execute.mockResolvedValue(contextView);

      const result = await gateway.startSession({});

      expect(result.context.instructions).not.toContain(SessionInstructionSignal.PRIMITIVE_GAPS_DETECTED);
    });

    it("should not include primitive-gaps-detected when no project context exists", async () => {
      const result = await gateway.startSession({});

      expect(result.context.instructions).not.toContain(SessionInstructionSignal.PRIMITIVE_GAPS_DETECTED);
    });

    it("should include primitive-gaps-detected when only some catalogs are empty", async () => {
      const contextView = createBaseContextView({
        context: {
          projectContext: {
            project: { name: "Test", purpose: "Testing" },
            audiences: [{ name: "Devs" }],
            audiencePains: [],
            valuePropositions: [{ title: "VP" }],
          } as any,
          activeGoals: [],
          pausedGoals: [],
          plannedGoals: [],
          recentDecisions: [],
        },
      });
      sessionContextQueryHandler.execute.mockResolvedValue(contextView);

      const result = await gateway.startSession({});

      expect(result.context.instructions).toContain(SessionInstructionSignal.PRIMITIVE_GAPS_DETECTED);
    });

    it("should include architecture-deprecated when architecture data exists", async () => {
      const mockArchitectureReader: jest.Mocked<IArchitectureReader> = {
        find: jest.fn<IArchitectureReader["find"]>().mockResolvedValue({
          architectureId: "architecture",
          description: "Test",
          organization: "Clean",
          patterns: [],
          principles: [],
          dataStores: [],
          stack: [],
          deprecated: false,
          version: 1,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        }),
      };

      const gatewayWithArch = new LocalStartSessionGateway(
        sessionContextQueryHandler,
        startSessionCommandHandler,
        brownfieldStatusReader,
        mockArchitectureReader,
      );

      const result = await gatewayWithArch.startSession({});

      expect(result.context.instructions).toContain(SessionInstructionSignal.ARCHITECTURE_DEPRECATED);
    });

    it("should not include architecture-deprecated when no architecture data exists", async () => {
      const mockArchitectureReader: jest.Mocked<IArchitectureReader> = {
        find: jest.fn<IArchitectureReader["find"]>().mockResolvedValue(null),
      };

      const gatewayWithArch = new LocalStartSessionGateway(
        sessionContextQueryHandler,
        startSessionCommandHandler,
        brownfieldStatusReader,
        mockArchitectureReader,
      );

      const result = await gatewayWithArch.startSession({});

      expect(result.context.instructions).not.toContain(SessionInstructionSignal.ARCHITECTURE_DEPRECATED);
    });

    it("should not include architecture-deprecated when no architecture reader provided", async () => {
      const result = await gateway.startSession({});

      expect(result.context.instructions).not.toContain(SessionInstructionSignal.ARCHITECTURE_DEPRECATED);
    });
  });

  describe("context passthrough", () => {
    it("should pass through session from base context", async () => {
      const session = {
        sessionId: "session-prev",
        status: "active" as const,
        focus: "Previous focus",
        contextSnapshot: null,
        version: 1,
        startedAt: "2025-01-01T10:00:00Z",
        endedAt: null,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-01T10:00:00Z",
      };
      sessionContextQueryHandler.execute.mockResolvedValue(
        createBaseContextView({ session })
      );

      const result = await gateway.startSession({});

      expect(result.context.session).toBe(session);
    });

    it("should pass through context data from base context", async () => {
      const activeGoals = [{ goalId: "g1", objective: "Active", status: "doing" } as GoalView];
      const contextView = createBaseContextView({
        context: {
          projectContext: null,
          activeGoals,
          pausedGoals: [],
          plannedGoals: [],
          recentDecisions: [],
        },
      });
      sessionContextQueryHandler.execute.mockResolvedValue(contextView);

      const result = await gateway.startSession({});

      expect(result.context.context.activeGoals).toBe(activeGoals);
    });
  });
});
