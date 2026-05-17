import { IAgentGateway } from "../../../agents/IAgentGateway.js";
import { IProcessManager, ProcessManagerEvent, ProcessManagerOptions, ProcessManagerResult } from "../../../daemons/IProcessManager.js";
import { IWorkerIdentityReader } from "../../../host/workers/IWorkerIdentityReader.js";
import { ITelemetryClient } from "../../../telemetry/ITelemetryClient.js";
import { GoalStatus } from "../../../../domain/goals/Constants.js";
import { GoalView } from "../GoalView.js";
import { IGoalStatusReader } from "../IGoalStatusReader.js";
import { GoalClaimPolicy } from "../claims/GoalClaimPolicy.js";
import { RefineGoalController } from "./RefineGoalController.js";
import { IGoalRefineReader } from "./IGoalRefineReader.js";

export class RefinerProcessManager implements IProcessManager {
  constructor(
    private readonly goalStatusReader: IGoalStatusReader,
    private readonly goalReader: IGoalRefineReader,
    private readonly claimPolicy: GoalClaimPolicy,
    private readonly workerIdentityReader: IWorkerIdentityReader,
    private readonly refineGoalController: RefineGoalController,
    private readonly agentGateway: IAgentGateway,
    private readonly telemetryClient: ITelemetryClient,
  ) {}

  async processNext(options: ProcessManagerOptions): Promise<ProcessManagerResult> {
    const startedAt = process.hrtime.bigint();
    const goals = await this.selectEligibleGoals();

    if (goals.length === 0) {
      this.emit(options, { daemon: "refiner", status: "idle" });
      this.track(startedAt, { status: "idle", attempts: 0 });
      return { status: "idle", attempts: 0 };
    }

    const goal = goals[0];

    try {
      await this.refineGoalController.handle({ goalId: goal.goalId });
    } catch (error) {
      this.emit(options, { daemon: "refiner", status: "failed", goalId: goal.goalId, ...this.errorProperties(error) });
      this.track(startedAt, { status: "failed", attempts: 0, goalId: goal.goalId, ...this.errorProperties(error) });
      return { status: "failed", goalId: goal.goalId, attempts: 0 };
    }

    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      this.emit(options, { daemon: "refiner", status: "processing", goalId: goal.goalId, attempt, maxRetries: options.maxRetries });
      const result = await this.agentGateway.invoke({ agentId: options.agentId, prompt: this.buildPrompt(goal.goalId) });

      if (await this.isGoalRefined(goal.goalId)) {
        this.emit(options, { daemon: "refiner", status: "completed", goalId: goal.goalId, attempt, maxRetries: options.maxRetries, exitCode: result.exitCode });
        this.track(startedAt, { status: "completed", attempts: attempt, goalId: goal.goalId, agentExitCode: result.exitCode });
        return { status: "completed", goalId: goal.goalId, attempts: attempt };
      }

      this.emit(options, {
        daemon: "refiner",
        status: attempt === options.maxRetries ? "exhausted" : "skipped",
        goalId: goal.goalId,
        attempt,
        maxRetries: options.maxRetries,
        exitCode: result.exitCode,
        ...this.agentFailureProperties(result),
      });
    }

    this.track(startedAt, { status: "exhausted", attempts: options.maxRetries, goalId: goal.goalId });
    return { status: "exhausted", goalId: goal.goalId, attempts: options.maxRetries };
  }

  async selectEligibleGoals(): Promise<GoalView[]> {
    const goals = await this.goalStatusReader.findByStatus(GoalStatus.TODO);
    const workerId = this.workerIdentityReader.workerId;
    return goals
      .filter((goal) => this.claimPolicy.canClaim(goal.goalId, workerId).allowed)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  buildPrompt(goalId: string): string {
    return `Run the Jumbo refinement workflow for goal ${goalId}. Execute: jumbo goal refine --id ${goalId}`;
  }

  private async isGoalRefined(goalId: string): Promise<boolean> {
    const goal = await this.goalReader.findById(goalId);
    return goal?.status === GoalStatus.REFINED;
  }

  private emit(options: ProcessManagerOptions, event: ProcessManagerEvent): void {
    options.emit?.(event);
  }

  private track(startedAt: bigint, properties: Record<string, unknown>): void {
    this.telemetryClient.track("refiner_process_completed", {
      daemon: "refiner",
      durationMs: Number((process.hrtime.bigint() - startedAt) / BigInt(1_000_000)),
      ...properties,
    });
  }

  private errorProperties(error: unknown): { errorType: string; errorMessage: string; errorStack?: string } {
    if (error instanceof Error) {
      return { errorType: error.name, errorMessage: error.message, errorStack: error.stack };
    }
    return { errorType: "UnknownError", errorMessage: String(error) };
  }

  private agentFailureProperties(result: { readonly exitCode: number; readonly stderr?: string }): { errorMessage?: string } {
    if (result.exitCode === 0 || result.stderr === undefined || result.stderr.trim().length === 0) {
      return {};
    }
    return { errorMessage: result.stderr.trim().split(/\r?\n/).at(-1) };
  }
}
