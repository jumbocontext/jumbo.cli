import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { DecisionRestoreOutputBuilder } from "./DecisionRestoreOutputBuilder.js";

export const metadata: CommandMetadata = {
  description: "Restore a reversed or superseded decision",
  category: "solution",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "Decision ID to restore"
    },
    {
      flags: "-r, --reason <reason>",
      description: "Reason for restoring the decision"
    }
  ],
  examples: [
    {
      command: "jumbo decision restore --id dec_123 --reason \"Decision remains valid\"",
      description: "Restore a reversed or superseded decision"
    }
  ],
  related: ["decision reverse", "decision supersede", "decision update"]
};

export async function decisionRestore(
  options: {
    id: string;
    reason: string;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new DecisionRestoreOutputBuilder();

  try {
    const response = await container.restoreDecisionController.handle({
      decisionId: options.id,
      reason: options.reason,
    });

    const output = outputBuilder.buildSuccess(response.decisionId, options.reason);
    renderer.info(output.toHumanReadable());
  } catch (error) {
    const output = outputBuilder.buildFailureError(error instanceof Error ? error : String(error));
    renderer.info(output.toHumanReadable());
    process.exit(1);
  }
}
