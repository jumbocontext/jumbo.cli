import * as fs from "fs-extra";
import * as path from "path";
import { Host } from "../../src/infrastructure/host/Host.js";
import { IApplicationContainer } from "../../src/application/host/IApplicationContainer.js";
import { EntityType } from "../../src/domain/relations/Constants.js";
import { ComponentType } from "../../src/domain/components/Constants.js";

describe("Relation deactivation cascade integration", () => {
  let tmpDir: string;
  let host: Host;
  let container: IApplicationContainer;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(process.cwd(), "test-relation-cascade-"));
    host = new Host(tmpDir);
    container = await host.createBuilder().build();
  });

  afterEach(async () => {
    host.dispose();
    await new Promise((resolve) => setTimeout(resolve, 100));
    await fs.remove(tmpDir);
  });

  async function addDecision(title: string): Promise<string> {
    const response = await container.addDecisionController.handle({
      title,
      context: `${title} context`,
      rationale: `${title} rationale`,
    });
    return response.decisionId;
  }

  async function addComponent(name: string): Promise<string> {
    const response = await container.addComponentController.handle({
      name,
      type: ComponentType.SERVICE,
      description: `${name} description`,
      responsibility: `${name} responsibility`,
      path: `/src/${name}`,
    });
    return response.componentId;
  }

  it("reversing a decision deactivates all active relations linked to that decision", async () => {
    const decisionId = await addDecision("Reverse Decision");
    const componentId = await addComponent("ReverseComponent");
    const componentId2 = await addComponent("ReverseComponentTwo");

    await container.addRelationController.handle({
      fromEntityType: EntityType.DECISION,
      fromEntityId: decisionId,
      toEntityType: EntityType.COMPONENT,
      toEntityId: componentId,
      relationType: "depends-on",
      description: "Decision depends on component",
    });
    await container.addRelationController.handle({
      fromEntityType: EntityType.COMPONENT,
      fromEntityId: componentId2,
      toEntityType: EntityType.DECISION,
      toEntityId: decisionId,
      relationType: "supports",
      description: "Component supports decision",
    });

    await container.reverseDecisionController.handle({
      decisionId,
      reason: "Outdated",
    });

    const active = await container.getRelationsController.handle({ status: "active" });
    const deactivated = await container.getRelationsController.handle({ status: "deactivated" });
    expect(active.relations).toHaveLength(0);
    expect(deactivated.relations).toHaveLength(2);
  });

  it("superseding a decision deactivates relations linked to that decision", async () => {
    const decisionId = await addDecision("Old Decision");
    const supersedingDecisionId = await addDecision("New Decision");
    const componentId = await addComponent("SupersedeComponent");

    await container.addRelationController.handle({
      fromEntityType: EntityType.DECISION,
      fromEntityId: decisionId,
      toEntityType: EntityType.COMPONENT,
      toEntityId: componentId,
      relationType: "depends-on",
      description: "Decision depends on component",
    });

    await container.supersedeDecisionController.handle({
      decisionId,
      supersededBy: supersedingDecisionId,
    });

    const deactivated = await container.getRelationsController.handle({ status: "deactivated" });
    expect(deactivated.relations).toHaveLength(1);
    expect(deactivated.relations[0].status).toBe("deactivated");
  });

  it("deprecating a component deactivates relations linked to that component", async () => {
    const decisionId = await addDecision("Deprecation Decision");
    const componentId = await addComponent("DeprecatedComponent");

    await container.addRelationController.handle({
      fromEntityType: EntityType.DECISION,
      fromEntityId: decisionId,
      toEntityType: EntityType.COMPONENT,
      toEntityId: componentId,
      relationType: "depends-on",
      description: "Decision depends on component",
    });

    await container.deprecateComponentController.handle({
      componentId,
      reason: "Legacy",
    });

    const deactivated = await container.getRelationsController.handle({ status: "deactivated" });
    expect(deactivated.relations).toHaveLength(1);
    expect(deactivated.relations[0].toEntityId).toBe(componentId);
  });

  it("removing a component deactivates active relations linked to that component", async () => {
    const decisionId = await addDecision("Removal Decision");
    const componentId = await addComponent("RemovedComponent");

    await container.deprecateComponentController.handle({
      componentId,
      reason: "Preparing for removal",
    });

    await container.addRelationController.handle({
      fromEntityType: EntityType.DECISION,
      fromEntityId: decisionId,
      toEntityType: EntityType.COMPONENT,
      toEntityId: componentId,
      relationType: "depends-on",
      description: "Decision depends on removed component",
    });

    await container.removeComponentController.handle({ componentId });

    const deactivated = await container.getRelationsController.handle({ status: "deactivated" });
    expect(deactivated.relations.length).toBeGreaterThan(0);
    expect(deactivated.relations.some((relation) => relation.toEntityId === componentId)).toBe(true);
  });

  it("session start context includes deactivated relation warning data", async () => {
    const decisionId = await addDecision("Session Warning Decision");
    const componentId = await addComponent("SessionWarningComponent");

    await container.addRelationController.handle({
      fromEntityType: EntityType.DECISION,
      fromEntityId: decisionId,
      toEntityType: EntityType.COMPONENT,
      toEntityId: componentId,
      relationType: "depends-on",
      description: "Decision depends on component",
    });
    await container.reverseDecisionController.handle({
      decisionId,
      reason: "Reversed for warning test",
    });

    const sessionStart = await container.sessionStartController.handle({});
    expect(sessionStart.context.context.deactivatedRelations.count).toBeGreaterThan(0);
    expect(sessionStart.context.context.deactivatedRelations.summary.length).toBeGreaterThan(0);
  });

  it("relations query supports filtering by deactivated status", async () => {
    const decisionId = await addDecision("List Decision");
    const componentId = await addComponent("ListComponent");

    await container.addRelationController.handle({
      fromEntityType: EntityType.DECISION,
      fromEntityId: decisionId,
      toEntityType: EntityType.COMPONENT,
      toEntityId: componentId,
      relationType: "depends-on",
      description: "Decision depends on component",
    });
    await container.reverseDecisionController.handle({
      decisionId,
      reason: "Trigger deactivation",
    });

    const deactivated = await container.getRelationsController.handle({ status: "deactivated" });
    const active = await container.getRelationsController.handle({ status: "active" });

    expect(deactivated.relations.length).toBeGreaterThan(0);
    expect(deactivated.relations.every((relation) => relation.status === "deactivated")).toBe(true);
    expect(active.relations).toHaveLength(0);
  });
});
