import { EvolveStepResult } from "../../../../application/evolve/EvolveStepResult.js";
import { TerminalOutput } from "../../output/TerminalOutput.js";
import { TerminalOutputBuilder } from "../../output/TerminalOutputBuilder.js";

export class EvolveOutputBuilder {
  private readonly builder = new TerminalOutputBuilder();

  buildSuccess(steps: EvolveStepResult[]): TerminalOutput {
    const hasFailures = steps.some((step) => step.status === "failed");

    this.builder.reset();
    this.builder.addPrompt(hasFailures ? "⚠ Evolve completed with errors" : "✓ Evolve complete");
    this.builder.addData(
      steps.map((step) => ({
        step: step.name,
        status: step.status,
        ...(step.detail ? { detail: step.detail } : {}),
      }))
    );
    return this.builder.build();
  }

  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✗ Evolve failed");
    this.builder.addData({
      message: error instanceof Error ? error.message : error,
    });
    return this.builder.build();
  }

  buildConfirmationRequired(): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      "⚠ This will update schema, migrate data, refresh managed agent files and skills, ensure settings, and rebuild projections.\n" +
        "Use --yes flag to proceed."
    );
    return this.builder.build();
  }
}
