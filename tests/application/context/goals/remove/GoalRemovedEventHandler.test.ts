import { GoalRemovedEventHandler } from "../../../../../src/application/context/goals/remove/GoalRemovedEventHandler.js";
import { IGoalRemovedProjector } from "../../../../../src/application/context/goals/remove/IGoalRemovedProjector.js";
import { GoalRemovedEvent } from "../../../../../src/domain/goals/remove/GoalRemovedEvent.js";
import { IRelationMaintenanceGoalRegistrar } from "../../../../../src/application/context/relations/maintain/IRelationMaintenanceGoalRegistrar.js";
import { jest } from "@jest/globals";

describe("GoalRemovedEventHandler", () => {
  let projector: jest.Mocked<IGoalRemovedProjector>;
  let relationMaintenanceGoalRegistrar: jest.Mocked<IRelationMaintenanceGoalRegistrar>;
  let handler: GoalRemovedEventHandler;

  beforeEach(() => {
    projector = {
      applyGoalRemoved: jest.fn().mockResolvedValue(undefined),
    };
    relationMaintenanceGoalRegistrar = {
      execute: jest.fn().mockResolvedValue(null),
    };
    handler = new GoalRemovedEventHandler(projector, relationMaintenanceGoalRegistrar);
  });

  it("registers relation maintenance goal before projecting removal", async () => {
    const event: GoalRemovedEvent = {
      type: "GoalRemovedEvent",
      aggregateId: "goal_123",
      version: 2,
      timestamp: "2026-03-01T00:00:00.000Z",
      payload: { removedAt: "2026-03-01T00:00:00.000Z" },
    };

    await handler.handle(event);

    expect(relationMaintenanceGoalRegistrar.execute).toHaveBeenCalledWith(
      "goal",
      "goal_123",
      "goal was removed"
    );
    expect(projector.applyGoalRemoved).toHaveBeenCalledWith(event);
  });
});
