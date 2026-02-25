import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';
import { UpgradeResponse } from '../../../../../application/maintenance/upgrade/UpgradeResponse.js';

/**
 * Specialized builder for upgrade command output.
 * Encapsulates all output rendering for the upgrade command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class UpgradeOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  buildSuccess(response: UpgradeResponse): TerminalOutput {
    this.builder.reset();

    if (response.migratedGoals === 0) {
      this.builder.addPrompt(
        "No goals require migration. All statuses are already up to date.\n\n" +
        "Next step: Run 'jumbo db rebuild --yes' to rebuild projections."
      );
    } else {
      this.builder.addPrompt(
        `Migration complete.\n\n` +
        `  Goals migrated:   ${response.migratedGoals}\n` +
        `  Events appended:  ${response.eventsAppended}\n\n` +
        "Next step: Run 'jumbo db rebuild --yes' to rebuild projections."
      );
    }

    return this.builder.build();
  }

  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("Failed to upgrade");
    this.builder.addData({
      message: error instanceof Error ? error.message : error
    });
    return this.builder.build();
  }
}
