import { describe, it, expect, beforeEach } from "@jest/globals";
import { SessionContextQueryHandler } from "../../../../../src/application/context/sessions/get/SessionContextQueryHandler.js";
import { ISessionViewReader } from "../../../../../src/application/context/sessions/get/ISessionViewReader.js";
import { IGoalStatusReader } from "../../../../../src/application/context/goals/IGoalStatusReader.js";
import { IDecisionViewReader } from "../../../../../src/application/context/decisions/get/IDecisionViewReader.js";
import { IProjectContextReader } from "../../../../../src/application/context/project/query/IProjectContextReader.js";
import { IAudienceContextReader } from "../../../../../src/application/context/audiences/query/IAudienceContextReader.js";
import { IAudiencePainContextReader } from "../../../../../src/application/context/audience-pains/query/IAudiencePainContextReader.js";
import { IRelationViewReader } from "../../../../../src/application/context/relations/get/IRelationViewReader.js";
import { GoalStatus } from "../../../../../src/domain/goals/Constants.js";
import { GoalView } from "../../../../../src/application/context/goals/GoalView.js";
import { SessionView } from "../../../../../src/application/context/sessions/SessionView.js";

describe("SessionContextQueryHandler", () => {
  let sessionViewReader: jest.Mocked<ISessionViewReader>;
  let goalStatusReader: jest.Mocked<IGoalStatusReader>;
  let decisionViewReader: jest.Mocked<IDecisionViewReader>;
  let relationViewReader: jest.Mocked<IRelationViewReader>;
  let projectContextReader: jest.Mocked<IProjectContextReader>;
  let audienceContextReader: jest.Mocked<IAudienceContextReader>;
  let audiencePainContextReader: jest.Mocked<IAudiencePainContextReader>;

  beforeEach(() => {
    sessionViewReader = {
      findAll: jest.fn().mockResolvedValue([]),
      findActive: jest.fn().mockResolvedValue(null),
    } as jest.Mocked<ISessionViewReader>;

    goalStatusReader = {
      findByStatus: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<IGoalStatusReader>;

    decisionViewReader = {
      findAll: jest.fn().mockResolvedValue([]),
      findByIds: jest.fn().mockResolvedValue([]),
    } as jest.Mocked<IDecisionViewReader>;

    relationViewReader = {
      findAll: jest.fn().mockResolvedValue([]),
    };

    projectContextReader = {
      getProject: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<IProjectContextReader>;

    audienceContextReader = {
      findAllActive: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<IAudienceContextReader>;

    audiencePainContextReader = {
      findAllActive: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<IAudiencePainContextReader>;
  });

  function createHandler(): SessionContextQueryHandler {
    return new SessionContextQueryHandler(
      sessionViewReader,
      goalStatusReader,
      decisionViewReader,
      relationViewReader,
      projectContextReader,
      audienceContextReader,
      audiencePainContextReader
    );
  }

  it("should return null session when no active session exists", async () => {
    const handler = createHandler();
    const result = await handler.execute();

    expect(result.session).toBeNull();
  });

  it("should return session from active session", async () => {
    const activeSession: SessionView = {
      sessionId: "session-1",
      status: "active",
      focus: "Test focus",
      contextSnapshot: null,
      version: 1,
      startedAt: "2025-01-01T10:00:00Z",
      endedAt: null,
      createdAt: "2025-01-01T10:00:00Z",
      updatedAt: "2025-01-01T10:00:00Z",
    };
    sessionViewReader.findActive.mockResolvedValue(activeSession);

    const handler = createHandler();
    const result = await handler.execute();

    expect(result.session).toBe(activeSession);
    expect(result.session?.sessionId).toBe("session-1");
    expect(result.session?.status).toBe("active");
    expect(result.session?.focus).toBe("Test focus");
    expect(result.session?.startedAt).toBe("2025-01-01T10:00:00Z");
  });

  it("should return null projectContext when no project exists", async () => {
    const handler = createHandler();
    const result = await handler.execute();

    expect(result.context.projectContext).toBeNull();
    expect(result.context.deactivatedRelations).toEqual({
      count: 0,
      summary: "No deactivated relations.",
    });
  });

  it("should assemble projectContext with audiences and pains", async () => {
    const project = { name: "TestProject", purpose: "Testing" };
    const audiences = [{ name: "Devs", description: "Developers", priority: "primary" }];
    const pains = [{ title: "Pain1", description: "A pain point" }];

    projectContextReader.getProject.mockResolvedValue(project as any);
    audienceContextReader.findAllActive.mockResolvedValue(audiences as any);
    audiencePainContextReader.findAllActive.mockResolvedValue(pains as any);

    const handler = createHandler();
    const result = await handler.execute();

    expect(result.context.projectContext).toEqual({
      project,
      audiences,
      audiencePains: pains,
    });
  });

  it("should separate doing, blocked, in-review, and qualified goals as activeGoals", async () => {
    const doingGoal = { goalId: "g1", status: GoalStatus.DOING } as GoalView;
    const blockedGoal = { goalId: "g2", status: GoalStatus.BLOCKED } as GoalView;
    const inReviewGoal = { goalId: "g3", status: GoalStatus.INREVIEW } as GoalView;
    const qualifiedGoal = { goalId: "g4", status: GoalStatus.QUALIFIED } as GoalView;

    goalStatusReader.findByStatus.mockImplementation(async (status: string) => {
      switch (status) {
        case GoalStatus.DOING: return [doingGoal];
        case GoalStatus.BLOCKED: return [blockedGoal];
        case GoalStatus.INREVIEW: return [inReviewGoal];
        case GoalStatus.QUALIFIED: return [qualifiedGoal];
        default: return [];
      }
    });

    const handler = createHandler();
    const result = await handler.execute();

    expect(result.context.activeGoals).toEqual([doingGoal, blockedGoal, inReviewGoal, qualifiedGoal]);
  });

  it("should return paused goals separately", async () => {
    const pausedGoal = { goalId: "g1", status: GoalStatus.PAUSED } as GoalView;

    goalStatusReader.findByStatus.mockImplementation(async (status: string) => {
      if (status === GoalStatus.PAUSED) return [pausedGoal];
      return [];
    });

    const handler = createHandler();
    const result = await handler.execute();

    expect(result.context.pausedGoals).toEqual([pausedGoal]);
    expect(result.context.activeGoals).toEqual([]);
  });

  it("should combine todo and refined goals as plannedGoals", async () => {
    const todoGoal = { goalId: "g1", status: GoalStatus.TODO } as GoalView;
    const refinedGoal = { goalId: "g2", status: GoalStatus.REFINED } as GoalView;

    goalStatusReader.findByStatus.mockImplementation(async (status: string) => {
      if (status === GoalStatus.TODO) return [todoGoal];
      if (status === GoalStatus.REFINED) return [refinedGoal];
      return [];
    });

    const handler = createHandler();
    const result = await handler.execute();

    expect(result.context.plannedGoals).toEqual([todoGoal, refinedGoal]);
  });

  it("should return recent active decisions", async () => {
    const decisions = [
      { decisionId: "d1", title: "Decision 1", createdAt: "2025-01-02T00:00:00Z" },
      { decisionId: "d2", title: "Decision 2", createdAt: "2025-01-01T00:00:00Z" },
    ];
    decisionViewReader.findAll.mockResolvedValue(decisions as any);

    const handler = createHandler();
    const result = await handler.execute();

    expect(result.context.recentDecisions).toHaveLength(2);
    expect(result.context.recentDecisions[0].decisionId).toBe("d1");
    expect(decisionViewReader.findAll).toHaveBeenCalledWith("active");
  });

  it("should include deactivated relation summary when present", async () => {
    relationViewReader.findAll.mockResolvedValue([
      {
        relationId: "rel_1",
        fromEntityType: "decision",
        fromEntityId: "dec_1",
        toEntityType: "component",
        toEntityId: "comp_1",
        relationType: "depends-on",
        strength: null,
        description: "test",
        status: "deactivated",
        version: 2,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      } as any,
    ]);

    const handler = createHandler();
    const result = await handler.execute();

    expect(result.context.deactivatedRelations.count).toBe(1);
    expect(result.context.deactivatedRelations.summary).toContain("decision:dec_1 -> component:comp_1");
    expect(relationViewReader.findAll).toHaveBeenCalledWith({ status: "deactivated" });
  });

  it("should limit recent decisions to 10", async () => {
    const decisions = Array.from({ length: 15 }, (_, i) => ({
      decisionId: `d${i}`,
      title: `Decision ${i}`,
      createdAt: `2025-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
    }));
    decisionViewReader.findAll.mockResolvedValue(decisions as any);

    const handler = createHandler();
    const result = await handler.execute();

    expect(result.context.recentDecisions).toHaveLength(10);
  });

  it("should handle missing optional readers gracefully", async () => {
    const handler = new SessionContextQueryHandler(
      sessionViewReader,
      goalStatusReader,
      decisionViewReader,
      relationViewReader
    );

    const result = await handler.execute();

    expect(result.context.projectContext).toBeNull();
  });
});
