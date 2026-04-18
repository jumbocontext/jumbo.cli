import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';
import { RelationView } from '../../../../../application/context/relations/RelationView.js';
import { Colors, BrandColors, Symbols } from '../../../rendering/StyleConfig.js';
import { heading, contentLine, metaField, wrapContent } from '../../../rendering/OutputLayout.js';

export class RelationListOutputBuilder {
  private builder = new TerminalOutputBuilder();

  build(relations: RelationView[], filter?: string): TerminalOutput {
    this.builder.reset();
    const filterLabel = filter ? ` (${filter})` : "";
    const lines: string[] = [];

    lines.push("");
    lines.push(heading(`Relations${filterLabel} (${relations.length})`));

    for (let i = 0; i < relations.length; i++) {
      const r = relations[i];
      if (i > 0) lines.push("");
      const arrow = `${r.fromEntityType}:${r.fromEntityId} --[${r.relationType}]--> ${r.toEntityType}:${r.toEntityId}`;
      lines.push(contentLine(BrandColors.accentCyan(arrow)));
      lines.push(...wrapContent(r.description));
      if (r.strength) {
        lines.push(metaField("Strength", Colors.muted(r.strength), 10));
      }
      lines.push(metaField("Status", Colors.muted(r.status), 10));
      lines.push(metaField("ID", Colors.muted(r.relationId), 10));
    }

    this.builder.addPrompt(lines.join("\n"));
    return this.builder.build();
  }

  buildStructuredOutput(relations: RelationView[], filter?: { entityType?: string | null; entityId?: string | null; status?: string }): TerminalOutput {
    this.builder.reset();
    this.builder.addData({
      count: relations.length,
      filter: filter ?? null,
      relations: relations.map((r) => ({
        relationId: r.relationId,
        fromEntityType: r.fromEntityType,
        fromEntityId: r.fromEntityId,
        toEntityType: r.toEntityType,
        toEntityId: r.toEntityId,
        relationType: r.relationType,
        strength: r.strength,
        description: r.description,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    });
    return this.builder.build();
  }

  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(`${Symbols.cross} ${Colors.error("Failed to list relations")}`);
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }
}
