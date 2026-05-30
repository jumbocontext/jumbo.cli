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

const REFINER_EVENT_SOURCE = "refiner";
const REFINER_EVENT_TEXT_FIELD_MAX_LENGTH = 2_048;
const REFINER_EVENT_COPY = {
  noWork: {
    category: "foraging",
    message: "foraging for defined goals",
  },
  workStarted: {
    category: "work-started",
    message: "refining goal",
  },
  completed: {
    category: "completed",
    message: "goal refined",
  },
  skipped: {
    category: "skipped",
    message: "goal not refined after agent attempt",
  },
  exhausted: {
    category: "exhausted",
    message: "refinement attempts exhausted",
  },
  failed: {
    category: "failed",
    message: "refinement failed",
  },
} as const;

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
      this.emit(options, {
        daemon: REFINER_EVENT_SOURCE,
        status: "idle",
        source: REFINER_EVENT_SOURCE,
        ...REFINER_EVENT_COPY.noWork,
      });
      this.track(startedAt, { status: "idle", attempts: 0 });
      return { status: "idle", attempts: 0 };
    }

    const goal = goals[0];

    try {
      await this.refineGoalController.handle({ goalId: goal.goalId });
    } catch (error) {
      const errorProperties = this.errorProperties(error);
      this.emit(options, {
        daemon: REFINER_EVENT_SOURCE,
        status: "failed",
        source: REFINER_EVENT_SOURCE,
        goalId: goal.goalId,
        ...REFINER_EVENT_COPY.failed,
        ...errorProperties,
      });
      this.track(startedAt, { status: "failed", attempts: 0, goalId: goal.goalId, ...errorProperties });
      return { status: "failed", goalId: goal.goalId, attempts: 0 };
    }

    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      this.emit(options, {
        daemon: REFINER_EVENT_SOURCE,
        status: "processing",
        source: REFINER_EVENT_SOURCE,
        goalId: goal.goalId,
        attempt,
        maxRetries: options.maxRetries,
        ...REFINER_EVENT_COPY.workStarted,
      });
      const result = await this.agentGateway.invoke({ agentId: options.agentId, prompt: this.buildPrompt(goal.goalId) });

      if (await this.isGoalRefined(goal.goalId)) {
        this.emit(options, {
          daemon: REFINER_EVENT_SOURCE,
          status: "completed",
          source: REFINER_EVENT_SOURCE,
          goalId: goal.goalId,
          attempt,
          maxRetries: options.maxRetries,
          exitCode: result.exitCode,
          ...REFINER_EVENT_COPY.completed,
        });
        this.track(startedAt, { status: "completed", attempts: attempt, goalId: goal.goalId, agentExitCode: result.exitCode });
        return { status: "completed", goalId: goal.goalId, attempts: attempt };
      }

      const retryExhausted = attempt === options.maxRetries;
      this.emit(options, {
        daemon: REFINER_EVENT_SOURCE,
        status: retryExhausted ? "exhausted" : "skipped",
        source: REFINER_EVENT_SOURCE,
        goalId: goal.goalId,
        attempt,
        maxRetries: options.maxRetries,
        exitCode: result.exitCode,
        ...(retryExhausted ? REFINER_EVENT_COPY.exhausted : REFINER_EVENT_COPY.skipped),
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
      return {
        errorType: error.name,
        errorMessage: limitTextTail(error.message, REFINER_EVENT_TEXT_FIELD_MAX_LENGTH),
        errorStack: error.stack === undefined
          ? undefined
          : limitTextTail(error.stack, REFINER_EVENT_TEXT_FIELD_MAX_LENGTH),
      };
    }
    return {
      errorType: "UnknownError",
      errorMessage: limitTextTail(String(error), REFINER_EVENT_TEXT_FIELD_MAX_LENGTH),
    };
  }

  private agentFailureProperties(result: { readonly exitCode: number; readonly stderr?: string }): { errorMessage?: string } {
    if (result.exitCode === 0 || result.stderr === undefined || result.stderr.trim().length === 0) {
      return {};
    }
    const lastLine = result.stderr.trim().split(/\r?\n/).at(-1);
    return lastLine === undefined
      ? {}
      : { errorMessage: limitTextTail(lastLine, REFINER_EVENT_TEXT_FIELD_MAX_LENGTH) };
  }
}

function limitTextTail(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(-maxLength) : value;
}
