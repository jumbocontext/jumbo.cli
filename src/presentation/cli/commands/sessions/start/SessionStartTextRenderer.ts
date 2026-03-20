import { EnrichedSessionContext } from "../../../../../application/context/sessions/get/EnrichedSessionContext.js";
import { SessionStartOutputBuilder } from "./SessionStartOutputBuilder.js";
import { SessionContextOutputBuilder } from "./SessionContextOutputBuilder.js";

export interface SessionStartTextRenderResult {
  readonly blocks: string[];
  readonly llmInstruction: string;
}

export interface SessionStartStructuredContext {
  readonly projectContext: Record<string, unknown> | null;
  readonly sessionContext: Record<string, unknown>;
  readonly goals: Record<string, unknown>;
  readonly llmInstructions: {
    readonly sessionContext: string | null;
    readonly goalStart: string;
  };
}

/**
 * SessionStartTextRenderer - Formats session start context for LLM orientation.
 *
 * Delegates to SessionStartOutputBuilder for composition.
 * Retained for backward compatibility with existing callers and tests.
 */
export class SessionStartTextRenderer {
  private readonly sessionStartOutputBuilder: SessionStartOutputBuilder;
  private readonly sessionContextOutputBuilder: SessionContextOutputBuilder;

  constructor() {
    this.sessionStartOutputBuilder = new SessionStartOutputBuilder();
    this.sessionContextOutputBuilder = new SessionContextOutputBuilder();
  }

  render(context: EnrichedSessionContext): SessionStartTextRenderResult {
    const output = this.sessionStartOutputBuilder.buildSessionStartOutput(context);

    const blocks = output.getSections()
      .filter(s => s.type === "prompt" && s.content)
      .map(s => s.content as string);

    // Last two sections are the separator and goal start instruction.
    // Extract the instruction separately for the legacy return shape.
    const goalStartIndex = blocks.findIndex(b => b.includes("@LLM: Prompt the user"));
    const llmInstruction = goalStartIndex >= 0 ? blocks.splice(goalStartIndex, 1)[0] : "";

    // Remove separator block
    const separatorIndex = blocks.findIndex(b => b.trim() === "---");
    if (separatorIndex >= 0) {
      blocks.splice(separatorIndex, 1);
    }

    return { blocks, llmInstruction };
  }

  buildStructuredContext(context: EnrichedSessionContext): SessionStartStructuredContext {
    const structured = this.sessionStartOutputBuilder.buildStructuredOutput(context, "");
    return {
      projectContext: structured.projectContext as Record<string, unknown> | null,
      sessionContext: structured.sessionContext as Record<string, unknown>,
      goals: structured.goals as Record<string, unknown>,
      llmInstructions: structured.llmInstructions as {
        sessionContext: string | null;
        goalStart: string;
      },
    };
  }

  renderSessionSummary(context: EnrichedSessionContext): string {
    return this.sessionContextOutputBuilder.renderSessionSummary(context);
  }
}
