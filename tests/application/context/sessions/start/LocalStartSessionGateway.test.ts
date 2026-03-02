import { describe, it, expect, beforeEach } from "@jest/globals";
import { LocalStartSessionGateway } from "../../../../../src/application/context/sessions/start/LocalStartSessionGateway.js";
import { SessionContextQueryHandler } from "../../../../../src/application/context/sessions/get/SessionContextQueryHandler.js";
import { StartSessionCommandHandler } from "../../../../../src/application/context/sessions/start/StartSessionCommandHandler.js";
import { UnprimedBrownfieldQualifier } from "../../../../../src/application/UnprimedBrownfieldQualifier.js";
import { ContextualSessionView } from "../../../../../src/application/context/sessions/get/ContextualSessionView.js";
import { GoalView } from "../../../../../src/application/context/goals/GoalView.js";

describe("LocalStartSessionGateway", () => {
  let sessionContextQueryHandler: jest.Mocked<SessionContextQueryHandler>;
  let startSessionCommandHandler: jest.Mocked<StartSessionCommandHandler>;
  let unprimedBrownfieldQualifier: jest.Mocked<UnprimedBrownfieldQualifier>;
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
        deactivatedRelations: { count: 0, summary: "No deactivated relations." },
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

    unprimedBrownfieldQualifier = {
      isUnprimed: jest.fn().mockResolvedValue(false),
    } as unknown as jest.Mocked<UnprimedBrownfieldQualifier>;

    gateway = new LocalStartSessionGateway(
      sessionContextQueryHandler,
      startSessionCommandHandler,
      unprimedBrownfieldQualifier
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

    expect(unprimedBrownfieldQualifier.isUnprimed).toHaveBeenCalledTimes(1);
  });

  describe("instruction building", () => {
    it("should always include goal-selection-prompt instruction", async () => {
      const result = await gateway.startSession({});

      expect(result.context.instructions).toContain("goal-selection-prompt");
    });

    it("should include brownfield-onboarding when project is unprimed", async () => {
      unprimedBrownfieldQualifier.isUnprimed.mockResolvedValue(true);

      const result = await gateway.startSession({});

      expect(result.context.instructions).toContain("brownfield-onboarding");
    });

    it("should not include brownfield-onboarding when project is primed", async () => {
      unprimedBrownfieldQualifier.isUnprimed.mockResolvedValue(false);

      const result = await gateway.startSession({});

      expect(result.context.instructions).not.toContain("brownfield-onboarding");
    });

    it("should include paused-goals-resume when paused goals exist", async () => {
      const contextView = createBaseContextView({
        context: {
          projectContext: null,
          activeGoals: [],
          pausedGoals: [{ goalId: "g1", objective: "Paused task", status: "paused" } as GoalView],
          plannedGoals: [],
          recentDecisions: [],
          deactivatedRelations: { count: 0, summary: "No deactivated relations." },
        },
      });
      sessionContextQueryHandler.execute.mockResolvedValue(contextView);

      const result = await gateway.startSession({});

      expect(result.context.instructions).toContain("paused-goals-resume");
    });

    it("should not include paused-goals-resume when no paused goals", async () => {
      const result = await gateway.startSession({});

      expect(result.context.instructions).not.toContain("paused-goals-resume");
    });

    it("should include all instructions when brownfield with paused goals", async () => {
      unprimedBrownfieldQualifier.isUnprimed.mockResolvedValue(true);
      const contextView = createBaseContextView({
        context: {
          projectContext: null,
          activeGoals: [],
          pausedGoals: [{ goalId: "g1", objective: "Paused", status: "paused" } as GoalView],
          plannedGoals: [],
          recentDecisions: [],
          deactivatedRelations: { count: 0, summary: "No deactivated relations." },
        },
      });
      sessionContextQueryHandler.execute.mockResolvedValue(contextView);

      const result = await gateway.startSession({});

      expect(result.context.instructions).toEqual([
        "brownfield-onboarding",
        "paused-goals-resume",
        "goal-selection-prompt",
      ]);
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
          deactivatedRelations: { count: 0, summary: "No deactivated relations." },
        },
      });
      sessionContextQueryHandler.execute.mockResolvedValue(contextView);

      const result = await gateway.startSession({});

      expect(result.context.context.activeGoals).toBe(activeGoals);
    });
  });
});
