import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";

export class DecisionRestoreOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  buildSuccess(decisionId: string, reason: string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✓ Decision restored");
    this.builder.addData({
      decisionId,
      status: "active",
      reason,
    });
    return this.builder.build();
  }

  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✗ Failed to restore decision");
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }
}
