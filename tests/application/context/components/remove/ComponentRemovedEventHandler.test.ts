import { ComponentRemovedEventHandler } from "../../../../../src/application/context/components/remove/ComponentRemovedEventHandler.js";
import { IComponentRemovedProjector } from "../../../../../src/application/context/components/remove/IComponentRemovedProjector.js";
import { ComponentRemovedEvent } from "../../../../../src/domain/components/remove/ComponentRemovedEvent.js";
import { RelationDeactivationCascade } from "../../../../../src/application/context/relations/deactivate/RelationDeactivationCascade.js";

describe("ComponentRemovedEventHandler", () => {
  let projector: jest.Mocked<IComponentRemovedProjector>;
  let relationDeactivationCascade: jest.Mocked<RelationDeactivationCascade>;
  let handler: ComponentRemovedEventHandler;

  beforeEach(() => {
    projector = {
      applyComponentRemoved: jest.fn().mockResolvedValue(undefined),
    };
    relationDeactivationCascade = {
      execute: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<RelationDeactivationCascade>;
    handler = new ComponentRemovedEventHandler(projector, relationDeactivationCascade);
  });

  it("projects removal and cascades relation deactivation", async () => {
    const event: ComponentRemovedEvent = {
      type: "ComponentRemovedEvent",
      aggregateId: "comp_123",
      version: 2,
      timestamp: "2026-03-01T00:00:00.000Z",
      payload: {
        status: "removed",
      },
    };

    await handler.handle(event);

    expect(projector.applyComponentRemoved).toHaveBeenCalledWith(event);
    expect(relationDeactivationCascade.execute).toHaveBeenCalledWith(
      "component",
      "comp_123",
      "Automatically deactivated because component comp_123 was removed"
    );
  });
});
