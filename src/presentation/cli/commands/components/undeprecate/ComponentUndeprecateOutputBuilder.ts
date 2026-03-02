import { TerminalOutputBuilder } from "../../../output/TerminalOutputBuilder.js";
import { TerminalOutput } from "../../../output/TerminalOutput.js";

export class ComponentUndeprecateOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  buildSuccess(componentId: string, name: string, reason: string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✓ Component undeprecated");
    this.builder.addData({
      componentId,
      name,
      status: "active",
      reason,
    });
    return this.builder.build();
  }

  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✗ Failed to undeprecate component");
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }
}
