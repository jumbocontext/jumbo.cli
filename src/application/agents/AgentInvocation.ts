export interface AgentInvocation {
  readonly agentId: string;
  readonly prompt: string;
  readonly onActivity?: (activity: AgentActivity) => void;
}

export interface AgentActivity {
  readonly stream: "stdout" | "stderr";
  readonly text: string;
}

export interface AgentInvocationResult {
  readonly exitCode: number;
  readonly stdout?: string;
  readonly stderr?: string;
}
