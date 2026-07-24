import { RelationPathResult } from "../../../../../application/context/relations/path/RelationPathResult.js";
import { RelationView } from "../../../../../application/context/relations/RelationView.js";
import { RelationNodeReference } from "../../../../../application/context/relations/get/RelationNodeReference.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";
import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import {
  contentLine,
  heading,
  metaField,
} from "../../../rendering/OutputLayout.js";
import {
  BrandColors,
  Colors,
  Symbols,
} from "../../../rendering/StyleConfig.js";

export class RelationPathOutputBuilder {
  private readonly builder = new TerminalOutputBuilder();

  build(result: RelationPathResult): TerminalOutput {
    this.builder.reset();
    const lines = [
      "",
      heading(
        `Relation path from ${this.nodeLabel(result.from)} to ${this.nodeLabel(result.to)}`,
      ),
      metaField("Found", Colors.muted(String(result.found)), 11),
      metaField("Hops", Colors.muted(String(result.hopCount)), 11),
      metaField("Direction", Colors.muted(result.query.direction), 11),
      metaField("Max depth", Colors.muted(String(result.query.maxDepth)), 11),
    ];

    if (!result.found) {
      lines.push("");
      lines.push(
        contentLine(Colors.muted("No matching connection was found.")),
      );
    } else if (result.hopCount === 0) {
      lines.push("");
      lines.push(
        contentLine(BrandColors.accentCyan(this.nodeLabel(result.from))),
      );
    } else {
      for (let index = 0; index < result.edges.length; index++) {
        lines.push("");
        lines.push(
          contentLine(
            this.connectionLine(
              result.nodes[index],
              result.nodes[index + 1],
              result.edges[index],
            ),
          ),
        );
      }
    }

    this.builder.addPrompt(lines.join("\n"));
    return this.builder.build();
  }

  buildStructuredOutput(result: RelationPathResult): TerminalOutput {
    this.builder.reset();
    this.builder.addData({
      found: result.found,
      endpoints: {
        from: { ...result.from },
        to: { ...result.to },
      },
      hopCount: result.hopCount,
      nodes: result.nodes.map((node) => ({ ...node })),
      edges: result.edges.map((edge) => this.edgeData(edge)),
      query: {
        maxDepth: result.query.maxDepth,
        direction: result.query.direction,
        relationType: result.query.relationType ?? null,
        entityType: result.query.entityType ?? null,
        strength: result.query.strength ?? null,
        status: result.query.status,
      },
    });
    return this.builder.build();
  }

  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    const message = error instanceof Error ? error.message : error;
    this.builder.addPrompt(
      `${Symbols.cross} ${Colors.error("Failed to find relation path")}: ${message}`,
    );
    this.builder.addData({ error: "Failed to find relation path", message });
    return this.builder.build();
  }

  private connectionLine(
    current: RelationNodeReference,
    next: RelationNodeReference,
    edge: RelationView,
  ): string {
    const relation = edge.strength
      ? `${edge.relationType}, ${edge.strength}`
      : edge.relationType;
    const followsOriginalDirection =
      edge.fromEntityType === current.entityType &&
      edge.fromEntityId === current.entityId &&
      edge.toEntityType === next.entityType &&
      edge.toEntityId === next.entityId;
    const connection = followsOriginalDirection
      ? `${this.nodeLabel(current)} --[${relation}]--> ${this.nodeLabel(next)}`
      : `${this.nodeLabel(current)} <--[${relation}]-- ${this.nodeLabel(next)}`;

    return `${connection} ${Colors.muted(`— ${edge.description}`)}`;
  }

  private edgeData(edge: RelationView): Record<string, unknown> {
    return {
      relationId: edge.relationId,
      fromEntityType: edge.fromEntityType,
      fromEntityId: edge.fromEntityId,
      toEntityType: edge.toEntityType,
      toEntityId: edge.toEntityId,
      relationType: edge.relationType,
      strength: edge.strength,
      description: edge.description,
      status: edge.status,
      createdAt: edge.createdAt,
      updatedAt: edge.updatedAt,
    };
  }

  private nodeLabel(node: RelationNodeReference): string {
    return `${node.entityType}:${node.entityId}`;
  }
}
