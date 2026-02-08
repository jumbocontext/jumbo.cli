import { describe, it, expect, beforeEach } from "@jest/globals";
import { SessionContextQueryHandler } from "../../../../src/application/sessions/get-context/SessionContextQueryHandler.js";
import { ISessionSummaryReader } from "../../../../src/application/sessions/get-context/ISessionSummaryReader.js";
import { IGoalStatusReader } from "../../../../src/application/goals/IGoalStatusReader.js";
import { IProjectContextReader } from "../../../../src/application/project/query/IProjectContextReader.js";
import { IAudienceContextReader } from "../../../../src/application/audiences/query/IAudienceContextReader.js";
import { IAudiencePainContextReader } from "../../../../src/application/audience-pains/query/IAudiencePainContextReader.js";
import { UnprimedBrownfieldQualifier } from "../../../../src/application/UnprimedBrownfieldQualifier.js";
import { GoalStatus } from "../../../../src/domain/goals/Constants.js";
import { GoalView } from "../../../../src/application/goals/GoalView.js";
import { SessionSummaryProjection } from "../../../../src/application/sessions/SessionSummaryView.js";

describe("SessionContextQueryHandler", () => {
  let sessionSummaryReader: jest.Mocked<ISessionSummaryReader>;
  let goalStatusReader: jest.Mocked<IGoalStatusReader>;
  let projectContextReader: jest.Mocked<IProjectContextReader>;
  let audienceContextReader: jest.Mocked<IAudienceContextReader>;
  let audiencePainContextReader: jest.Mocked<IAudiencePainContextReader>;
  let unprimedBrownfieldQualifier: jest.Mocked<UnprimedBrownfieldQualifier>;

  beforeEach(() => {
    sessionSummaryReader = {
      findLatest: jest.fn().mockResolvedValue(null),
    } as jest.Mocked<ISessionSummaryReader>;

    goalStatusReader = {
      findByStatus: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<IGoalStatusReader>;

    projectContextReader = {
      getProject: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<IProjectContextReader>;

    audienceContextReader = {
      findAllActive: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<IAudienceContextReader>;

    audiencePainContextReader = {
      findAllActive: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<IAudiencePainContextReader>;

    unprimedBrownfieldQualifier = {
      isUnprimed: jest.fn().mockResolvedValue(false),
    } as unknown as jest.Mocked<UnprimedBrownfieldQualifier>;
  });

  function createHandler(): SessionContextQueryHandler {
    return new SessionContextQueryHandler(
      sessionSummaryReader,
      goalStatusReader,
      projectContextReader,
      audienceContextReader,
      audiencePainContextReader,
      unprimedBrownfieldQualifier
    );
  }

  it("should return null projectContext when no project exists", async () => {
    const handler = createHandler();
    const result = await handler.execute();

    expect(result.projectContext).toBeNull();
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

    expect(result.projectContext).toEqual({
      project,
      audiences,
      audiencePains: pains,
    });
  });

  it("should return latest session summary", async () => {
    const summary: Partial<SessionSummaryProjection> = {
      sessionId: "LATEST",
      focus: "Test session",
      status: "active",
    };
    sessionSummaryReader.findLatest.mockResolvedValue(summary as SessionSummaryProjection);

    const handler = createHandler();
    const result = await handler.execute();

    expect(result.latestSessionSummary).toBe(summary);
  });

  it("should combine doing, paused, and blocked goals as in-progress", async () => {
    const doingGoal = { goalId: "g1", status: GoalStatus.DOING } as GoalView;
    const pausedGoal = { goalId: "g2", status: GoalStatus.PAUSED } as GoalView;
    const blockedGoal = { goalId: "g3", status: GoalStatus.BLOCKED } as GoalView;

    goalStatusReader.findByStatus.mockImplementation(async (status: string) => {
      switch (status) {
        case GoalStatus.DOING: return [doingGoal];
        case GoalStatus.PAUSED: return [pausedGoal];
        case GoalStatus.BLOCKED: return [blockedGoal];
        case GoalStatus.TODO: return [];
        default: return [];
      }
    });

    const handler = createHandler();
    const result = await handler.execute();

    expect(result.inProgressGoals).toEqual([doingGoal, pausedGoal, blockedGoal]);
  });

  it("should return planned goals with todo status", async () => {
    const todoGoal = { goalId: "g4", status: GoalStatus.TODO } as GoalView;

    goalStatusReader.findByStatus.mockImplementation(async (status: string) => {
      if (status === GoalStatus.TODO) return [todoGoal];
      return [];
    });

    const handler = createHandler();
    const result = await handler.execute();

    expect(result.plannedGoals).toEqual([todoGoal]);
  });

  it("should set hasSolutionContext to true when project is primed", async () => {
    unprimedBrownfieldQualifier.isUnprimed.mockResolvedValue(false);

    const handler = createHandler();
    const result = await handler.execute();

    expect(result.hasSolutionContext).toBe(true);
  });

  it("should set hasSolutionContext to false when project is unprimed", async () => {
    unprimedBrownfieldQualifier.isUnprimed.mockResolvedValue(true);

    const handler = createHandler();
    const result = await handler.execute();

    expect(result.hasSolutionContext).toBe(false);
  });

  it("should handle missing optional readers gracefully", async () => {
    const handler = new SessionContextQueryHandler(
      sessionSummaryReader,
      goalStatusReader
    );

    const result = await handler.execute();

    expect(result.projectContext).toBeNull();
    expect(result.hasSolutionContext).toBe(true);
  });
});
