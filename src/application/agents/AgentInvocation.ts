export interface AgentInvocation {
  readonly agentId: string;
  readonly prompt: string;
}

export interface AgentInvocationResult {
  readonly exitCode: number;
  readonly stdout?: string;
  readonly stderr?: string;
}
