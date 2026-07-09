export type AgentId = "claude" | "antigravity" | "copilot" | "vibe" | "codex" | "cursor";

export interface AvailableAgent {
  readonly id: AgentId;
  readonly name: string;
}
