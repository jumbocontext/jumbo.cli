import { TerminalOutputBuilder } from '../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../output/TerminalOutput.js';
import { RepairStepResult } from '../../../../application/repair/RepairResponse.js';

/**
 * Specialized builder for repair command output.
 * Encapsulates all output rendering for the repair command.
 */
export class RepairOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for successful repair.
   * Renders repair results per step.
   */
  buildSuccess(steps: RepairStepResult[]): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✓ Repair complete");
    this.builder.addData(
      steps.map(s => ({
        step: s.name,
        status: s.status,
        ...(s.detail ? { detail: s.detail } : {}),
      }))
    );
    return this.builder.build();
  }

  /**
   * Build output for repair failure.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✗ Repair failed");
    this.builder.addData({
      message: error instanceof Error ? error.message : error
    });
    return this.builder.build();
  }

  /**
   * Build output when confirmation is required.
   */
  buildConfirmationRequired(): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      "⚠️  This will update agent configuration files (including template-managed skills) and optionally rebuild the database.\n" +
      "Template-managed skills may be overwritten to the latest template version; user-created skills are preserved.\n" +
      "Use --yes flag to proceed."
    );
    return this.builder.build();
  }
}
