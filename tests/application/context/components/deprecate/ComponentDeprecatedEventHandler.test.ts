import { ComponentDeprecatedEventHandler } from "../../../../../src/application/context/components/deprecate/ComponentDeprecatedEventHandler.js";
import { IComponentDeprecatedProjector } from "../../../../../src/application/context/components/deprecate/IComponentDeprecatedProjector.js";
import { ComponentDeprecatedEvent } from "../../../../../src/domain/components/deprecate/ComponentDeprecatedEvent.js";
import { RelationDeactivationCascade } from "../../../../../src/application/context/relations/deactivate/RelationDeactivationCascade.js";

describe("ComponentDeprecatedEventHandler", () => {
  let projector: jest.Mocked<IComponentDeprecatedProjector>;
  let relationDeactivationCascade: jest.Mocked<RelationDeactivationCascade>;
  let handler: ComponentDeprecatedEventHandler;

  beforeEach(() => {
    projector = {
      applyComponentDeprecated: jest.fn().mockResolvedValue(undefined),
    };
    relationDeactivationCascade = {
      execute: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<RelationDeactivationCascade>;
    handler = new ComponentDeprecatedEventHandler(projector, relationDeactivationCascade);
  });

  it("projects deprecation and cascades relation deactivation", async () => {
    const event: ComponentDeprecatedEvent = {
      type: "ComponentDeprecatedEvent",
      aggregateId: "comp_123",
      version: 2,
      timestamp: "2026-03-01T00:00:00.000Z",
      payload: {
        reason: "Legacy module",
        status: "deprecated",
      },
    };

    await handler.handle(event);

    expect(projector.applyComponentDeprecated).toHaveBeenCalledWith(event);
    expect(relationDeactivationCascade.execute).toHaveBeenCalledWith(
      "component",
      "comp_123",
      "Automatically deactivated because component comp_123 was deprecated: Legacy module"
    );
  });
});
