import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';
import { QualifyGoalResponse } from '../../../../../application/context/goals/qualify/QualifyGoalResponse.js';
import { Colors, Symbols } from '../../../rendering/StyleConfig.js';
import { EDGE, heading, contentLine, metaField } from '../../../rendering/OutputLayout.js';

/**
 * Specialized builder for goal.qualify command output.
 * Encapsulates all output rendering for the qualify goal command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 *
 * @deprecated Use GoalApproveOutputBuilder instead. This command is deprecated
 * in favor of 'jumbo goal approve'.
 */
export class GoalQualifyOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build deprecation warning output.
   * Advises users to switch to 'jumbo goal approve'.
   */
  buildDeprecationWarning(): TerminalOutput {
    this.builder.reset();
    const lines: string[] = [];
    lines.push("");
    lines.push(heading("Deprecation Notice"));
    lines.push(contentLine(`${Symbols.warning} ${Colors.warning("'jumbo goal qualify' is deprecated. Use 'jumbo goal approve' instead.")}`));
    this.builder.addPrompt(lines.join("\n"));
    return this.builder.build();
  }

  /**
   * Build output for successful goal qualification.
   * Renders qualification result with next steps.
   */
  buildSuccess(response: QualifyGoalResponse): TerminalOutput {
    this.builder.reset();
    const lines: string[] = [];

    lines.push("");
    lines.push(heading("Goal Qualified"));
    lines.push(contentLine(`${Symbols.check} ${Colors.success("QA review passed — ready for codification")}`));
    lines.push("");
    lines.push(metaField("Id", Colors.muted(response.goalId), 11));
    lines.push(metaField("Objective", Colors.primary(response.objective), 11));
    lines.push(metaField("Status", Colors.primary(response.status), 11));

    if (response.nextGoalId) {
      lines.push(metaField("Next Goal", Colors.muted(response.nextGoalId), 11));
    }

    this.builder.addPrompt(lines.join("\n"));
    this.builder.addPrompt(
      "\n" + `${EDGE}${Colors.primary("➤")} ${Colors.primary(`To codify: jumbo goal codify --id ${response.goalId}`)}`
    );

    return this.builder.build();
  }

  /**
   * Build output for goal qualification failure.
   * Renders error message when goal qualification fails.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(`${Symbols.cross} ${Colors.error("Failed to qualify goal")}`);
    this.builder.addData({
      message: error instanceof Error ? error.message : error
    });
    return this.builder.build();
  }
}
