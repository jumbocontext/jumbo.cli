import { ComponentUndeprecatedEventHandler } from "../../../../../src/application/context/components/undeprecate/ComponentUndeprecatedEventHandler.js";
import { IComponentUndeprecatedProjector } from "../../../../../src/application/context/components/undeprecate/IComponentUndeprecatedProjector.js";
import { ComponentUndeprecatedEvent } from "../../../../../src/domain/components/undeprecate/ComponentUndeprecatedEvent.js";
import { ComponentEventType } from "../../../../../src/domain/components/Constants.js";
import { RelationReactivationCascade } from "../../../../../src/application/context/relations/reactivate/RelationReactivationCascade.js";

describe("ComponentUndeprecatedEventHandler", () => {
  let projector: jest.Mocked<IComponentUndeprecatedProjector>;
  let relationReactivationCascade: jest.Mocked<RelationReactivationCascade>;
  let handler: ComponentUndeprecatedEventHandler;

  beforeEach(() => {
    projector = {
      applyComponentUndeprecated: jest.fn().mockResolvedValue(undefined),
    };
    relationReactivationCascade = {
      execute: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<RelationReactivationCascade>;
    handler = new ComponentUndeprecatedEventHandler(projector, relationReactivationCascade);
  });

  it("projects undeprecation and cascades relation reactivation", async () => {
    const event: ComponentUndeprecatedEvent = {
      type: ComponentEventType.UNDEPRECATED,
      aggregateId: "comp_123",
      version: 3,
      timestamp: "2026-03-02T00:00:00.000Z",
      payload: {
        reason: "Component still needed",
        undeprecatedAt: "2026-03-02T00:00:00.000Z",
      },
    };

    await handler.handle(event);

    expect(projector.applyComponentUndeprecated).toHaveBeenCalledWith(event);
    expect(relationReactivationCascade.execute).toHaveBeenCalledWith(
      "component",
      "comp_123",
      "Automatically reactivated because component comp_123 was undeprecated: Component still needed"
    );
  });
});
