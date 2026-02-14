import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';
import { ComponentView } from '../../../../../application/context/components/ComponentView.js';
import { RelationView } from '../../../../../application/context/relations/RelationView.js';

/**
 * Specialized builder for component.show command output.
 * Encapsulates all output rendering for the show component command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class ComponentShowOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  private formatStatus(status: string): string {
    switch (status) {
      case "active":
        return "active";
      case "deprecated":
        return "deprecated";
      case "removed":
        return "removed";
      default:
        return status;
    }
  }

  /**
   * Build output for TTY (human-readable formatted text).
   */
  build(component: ComponentView, relations: RelationView[]): TerminalOutput {
    this.builder.reset();

    let output = "\n=== Component Details ===\n\n" +
                 `Name:           ${component.name}\n` +
                 `ID:             ${component.componentId}\n` +
                 `Type:           ${component.type}\n` +
                 `Status:         ${this.formatStatus(component.status)}\n` +
                 `Description:    ${component.description}\n` +
                 `Responsibility: ${component.responsibility}\n` +
                 `Path:           ${component.path}`;

    if (component.deprecationReason) {
      output += `\nDeprecation:    ${component.deprecationReason}`;
    }

    output += `\nCreated:        ${component.createdAt}` +
              `\nUpdated:        ${component.updatedAt}`;

    this.builder.addPrompt(output);

    if (relations.length > 0) {
      let relationsOutput = "\n=== Relations ===\n";
      for (const relation of relations) {
        const direction = relation.fromEntityId === component.componentId
          ? `→ ${relation.toEntityType}:${relation.toEntityId}`
          : `← ${relation.fromEntityType}:${relation.fromEntityId}`;
        const strength = relation.strength ? ` [${relation.strength}]` : "";
        relationsOutput += `\n  ${relation.relationType}${strength} ${direction}`;
        if (relation.description) {
          relationsOutput += `\n    ${relation.description}`;
        }
      }
      this.builder.addPrompt(relationsOutput);
    } else {
      this.builder.addPrompt("\n=== Relations ===\n\n  No relations registered.");
    }

    return this.builder.build();
  }

  /**
   * Build output for non-TTY (structured JSON for programmatic consumers).
   */
  buildStructuredOutput(component: ComponentView, relations: RelationView[]): TerminalOutput {
    this.builder.reset();

    this.builder.addData({
      component: {
        componentId: component.componentId,
        name: component.name,
        type: component.type,
        status: component.status,
        description: component.description,
        responsibility: component.responsibility,
        path: component.path,
        deprecationReason: component.deprecationReason,
        createdAt: component.createdAt,
        updatedAt: component.updatedAt,
      },
      relations: relations.map(r => ({
        relationId: r.relationId,
        fromEntityType: r.fromEntityType,
        fromEntityId: r.fromEntityId,
        toEntityType: r.toEntityType,
        toEntityId: r.toEntityId,
        relationType: r.relationType,
        strength: r.strength,
        description: r.description,
      })),
    });

    return this.builder.build();
  }

  /**
   * Build output for component not found error.
   */
  buildNotFoundError(identifier: string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("Component not found");
    this.builder.addData({ message: `No component exists with ID or name: ${identifier}` });
    return this.builder.build();
  }

  /**
   * Build output for component show failure.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("Failed to show component");
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }
}
