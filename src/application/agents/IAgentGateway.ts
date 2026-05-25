import { AgentInvocation, AgentInvocationResult } from "./AgentInvocation.js";

export interface IAgentGateway {
  invoke(invocation: AgentInvocation): Promise<AgentInvocationResult>;
}
