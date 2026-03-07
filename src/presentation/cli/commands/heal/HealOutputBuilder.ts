import { RebuildDatabaseResponse } from "../../../../application/maintenance/db/rebuild/RebuildDatabaseResponse.js";
import { TerminalOutput } from "../../output/TerminalOutput.js";
import { TerminalOutputBuilder } from "../../output/TerminalOutputBuilder.js";

export class HealOutputBuilder extends TerminalOutputBuilder {
  buildSuccess(response: RebuildDatabaseResponse): TerminalOutput {
    this.reset();
    this.addPrompt(
      "Projection rebuild complete.\n\n" +
      `  Status:            ${response.success ? "success" : "failed"}\n` +
      `  Events replayed:   ${response.eventsReplayed}`
    );
    this.addData(this.buildStructuredOutput(response));
    return this.build();
  }

  buildFailureError(error: Error | string): TerminalOutput {
    this.reset();
    this.addPrompt("Projection rebuild failed.");
    this.addData({
      success: false,
      message: error instanceof Error ? error.message : error,
    });
    return this.build();
  }

  buildConfirmationRequired(): TerminalOutput {
    this.reset();
    this.addPrompt(
      "Healing projections will discard the current materialized views and replay the event store.\n" +
      "Use --yes flag to proceed."
    );
    return this.build();
  }

  buildStructuredOutput(response: RebuildDatabaseResponse) {
    return {
      success: response.success,
      eventsReplayed: response.eventsReplayed,
    };
  }
}
