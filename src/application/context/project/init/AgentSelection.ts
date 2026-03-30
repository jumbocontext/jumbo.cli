export type AgentId = "claude" | "gemini" | "copilot" | "vibe" | "codex" | "cursor";

export interface AvailableAgent {
  readonly id: AgentId;
  readonly name: string;
}
