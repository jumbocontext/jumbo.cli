import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';
import { MigrateDependenciesResponse } from '../../../../../application/maintenance/migrate-dependencies/MigrateDependenciesResponse.js';

/**
 * Specialized builder for dependency migration command output.
 * Encapsulates all output rendering for the migrate-dependencies command.
 */
export class MigrateDependenciesOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  buildSuccess(response: MigrateDependenciesResponse): TerminalOutput {
    this.builder.reset();

    const prefix = response.dryRun ? "[DRY RUN] " : "";

    if (response.totalLegacy === 0) {
      this.builder.addPrompt(
        `${prefix}No legacy component-coupling dependencies found. Nothing to migrate.`
      );
      return this.builder.build();
    }

    if (response.converted.length === 0 && response.skipped.length > 0) {
      this.builder.addPrompt(
        `${prefix}All ${response.totalLegacy} legacy dependencies were skipped.\n\n` +
        this.formatSkipped(response)
      );
      return this.builder.build();
    }

    let output =
      `${prefix}Migration complete.\n\n` +
      `  Legacy dependencies found:  ${response.totalLegacy}\n` +
      `  Converted to relations:     ${response.converted.length}\n` +
      `  Skipped:                    ${response.skipped.length}\n`;

    if (response.converted.length > 0) {
      output += "\nConverted:\n";
      for (const c of response.converted) {
        output += `  ${c.fromEntityId} → ${c.toEntityId}  (relation: ${c.relationId})\n`;
      }
    }

    if (response.skipped.length > 0) {
      output += "\n" + this.formatSkipped(response);
    }

    if (!response.dryRun) {
      output += "\nNext step: Run 'jumbo db rebuild --yes' to rebuild projections.";
    }

    this.builder.addPrompt(output);
    return this.builder.build();
  }

  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("Failed to migrate dependencies");
    this.builder.addData({
      message: error instanceof Error ? error.message : error
    });
    return this.builder.build();
  }

  private formatSkipped(response: MigrateDependenciesResponse): string {
    let output = "Skipped:\n";
    for (const s of response.skipped) {
      output += `  ${s.dependencyId}: ${s.reason}\n`;
    }
    return output;
  }
}
