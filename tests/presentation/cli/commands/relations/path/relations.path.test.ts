import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { FindRelationPathController } from "../../../../../../src/application/context/relations/path/FindRelationPathController.js";
import { IApplicationContainer } from "../../../../../../src/application/host/IApplicationContainer.js";
import {
  metadata,
  relationsPath,
} from "../../../../../../src/presentation/cli/commands/relations/path/relations.path.js";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer.js";

describe("relations.path command", () => {
  let handle: jest.Mock;
  let container: Partial<IApplicationContainer>;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    Renderer.configure({ format: "text", verbosity: "normal" });
    handle = jest.fn().mockResolvedValue({
      found: false,
      from: { entityType: "goal", entityId: "from" },
      to: { entityType: "component", entityId: "to" },
      hopCount: 0,
      nodes: [],
      edges: [],
      query: { maxDepth: 5, direction: "both", status: "active" },
    });
    container = {
      findRelationPathController: {
        handle,
      } as unknown as FindRelationPathController,
    };
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Renderer.reset();
  });

  it("declares typed endpoints, graph filters, and explicit project scope", () => {
    expect(metadata.requiresProject).toBe(true);
    expect(metadata.requiredOptions?.map((option) => option.flags)).toEqual([
      "--from-id <fromId>",
      "--to-id <toId>",
    ]);
    expect(metadata.options?.map((option) => option.flags)).toEqual(
      expect.arrayContaining([
        "--from-type <fromType>",
        "--to-type <toType>",
        "--max-depth <maxDepth>",
        "-d, --direction <direction>",
        "--relation-type <type>",
        "--entity-type <type>",
        "--strength <strength>",
        "-s, --status <status>",
      ]),
    );
  });

  it("uses ID-only endpoint and traversal defaults", async () => {
    await relationsPath(
      { fromId: "from", toId: "to" },
      container as IApplicationContainer,
    );

    expect(handle).toHaveBeenCalledWith({
      fromEntityId: "from",
      fromEntityType: undefined,
      toEntityId: "to",
      toEntityType: undefined,
      maxDepth: 5,
      direction: "both",
      relationType: undefined,
      relatedEntityType: undefined,
      strength: undefined,
      status: "active",
    });
  });

  it("parses typed endpoints and every traversal filter", async () => {
    await relationsPath(
      {
        fromId: "from",
        fromType: "goal",
        toId: "to",
        toType: "component",
        maxDepth: "3",
        direction: "out",
        relationType: "requires",
        entityType: "component",
        strength: "weak",
        status: "all",
      },
      container as IApplicationContainer,
    );

    expect(handle).toHaveBeenCalledWith(
      expect.objectContaining({
        fromEntityType: "goal",
        toEntityType: "component",
        maxDepth: 3,
        direction: "out",
        relationType: "requires",
        relatedEntityType: "component",
        strength: "weak",
        status: "all",
      }),
    );
  });

  it("emits exactly one complete structured result in JSON mode", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    await relationsPath(
      { fromId: "from", toId: "to" },
      container as IApplicationContainer,
    );

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const output = JSON.parse(String(consoleSpy.mock.calls[0][0])) as Record<
      string,
      unknown
    >;
    expect(output).toEqual(
      expect.objectContaining({
        found: false,
        endpoints: expect.any(Object),
        nodes: [],
        edges: [],
      }),
    );
  });
});
