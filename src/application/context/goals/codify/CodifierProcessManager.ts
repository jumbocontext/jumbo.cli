import type {
  IProcessManager,
  ProcessManagerEvent,
  ProcessManagerOptions,
  ProcessManagerResult,
  ProcessManagerStatus,
} from "../../../daemons/IProcessManager.js";
import { IAgentGateway } from "../../../agents/IAgentGateway.js";
import { ITelemetryClient } from "../../../telemetry/ITelemetryClient.js";
import { IWorkerIdentityReader } from "../../../host/workers/IWorkerIdentityReader.js";
import { IGoalStatusReader } from "../IGoalStatusReader.js";
import { GoalView } from "../GoalView.js";
import { GoalStatus } from "../../../../domain/goals/Constants.js";
import { GoalClaimPolicy } from "../claims/GoalClaimPolicy.js";
import { CodifyGoalController } from "./CodifyGoalController.js";
import { IGoalCodifyReader } from "./IGoalCodifyReader.js";

const CODIFIER_EVENT_SOURCE = "codifier";
const CODIFIER_EVENT_TEXT_FIELD_MAX_LENGTH = 2_048;
const CODIFIER_EVENT_COPY = {
  noWork: {
    category: "waiting",
    message: "awaiting approved goals",
  },
  workStarted: {
    category: "work-started",
    message: "codifying goal",
  },
  completed: {
    category: "completed",
    message: "goal codified",
  },
  skipped: {
    category: "skipped",
    message: "goal not codified after agent attempt",
  },
  exhausted: {
    category: "exhausted",
    message: "codification attempts exhausted",
  },
  failed: {
    category: "failed",
    message: "codification failed",
  },
} as const;

export type CodifierProcessStatus =
  ProcessManagerStatus;

export interface CodifierProcessEvent extends ProcessManagerEvent {
  readonly daemon: "codifier";
}

export type CodifierProcessOptions = ProcessManagerOptions;

export type CodifierProcessResult = ProcessManagerResult;

export class CodifierProcessManager implements IProcessManager {
  constructor(
    private readonly goalStatusReader: IGoalStatusReader,
    private readonly goalReader: IGoalCodifyReader,
    private readonly claimPolicy: GoalClaimPolicy,
    private readonly workerIdentityReader: IWorkerIdentityReader,
    private readonly codifyGoalController: CodifyGoalController,
    private readonly agentGateway: IAgentGateway,
    private readonly telemetryClient: ITelemetryClient,
  ) {}

  async processNext(options: CodifierProcessOptions): Promise<CodifierProcessResult> {
    const startedAt = process.hrtime.bigint();
    const goals = await this.selectEligibleGoals();

    if (goals.length === 0) {
      this.emit(options, {
        daemon: CODIFIER_EVENT_SOURCE,
        status: "idle",
        source: CODIFIER_EVENT_SOURCE,
        ...CODIFIER_EVENT_COPY.noWork,
      });
      this.track("codifier_process_completed", startedAt, { status: "idle", attempts: 0 });
      return { status: "idle", attempts: 0 };
    }

    const goal = goals[0];

    try {
      await this.codifyGoalController.handle({ goalId: goal.goalId });
    } catch (error) {
      this.emitFailure(options, goal.goalId, error);
      this.track("codifier_process_completed", startedAt, {
        status: "failed",
        attempts: 0,
        goalId: goal.goalId,
        ...this.errorProperties(error),
      });
      return { status: "failed", goalId: goal.goalId, attempts: 0 };
    }

    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      this.emit(options, {
        daemon: CODIFIER_EVENT_SOURCE,
        status: "processing",
        source: CODIFIER_EVENT_SOURCE,
        goalId: goal.goalId,
        attempt,
        maxRetries: options.maxRetries,
        ...CODIFIER_EVENT_COPY.workStarted,
      });

      const result = await this.agentGateway.invoke({
        agentId: options.agentId,
        prompt: this.buildPrompt(goal.goalId),
      });

      if (await this.isGoalDone(goal.goalId)) {
        this.emit(options, {
          daemon: CODIFIER_EVENT_SOURCE,
          status: "completed",
          source: CODIFIER_EVENT_SOURCE,
          goalId: goal.goalId,
          attempt,
          maxRetries: options.maxRetries,
          exitCode: result.exitCode,
          ...CODIFIER_EVENT_COPY.completed,
        });
        this.track("codifier_process_completed", startedAt, {
          status: "completed",
          attempts: attempt,
          goalId: goal.goalId,
          agentExitCode: result.exitCode,
        });
        return { status: "completed", goalId: goal.goalId, attempts: attempt };
      }

      const retryExhausted = attempt === options.maxRetries;
      this.emit(options, {
        daemon: CODIFIER_EVENT_SOURCE,
        status: retryExhausted ? "exhausted" : "skipped",
        source: CODIFIER_EVENT_SOURCE,
        goalId: goal.goalId,
        attempt,
        maxRetries: options.maxRetries,
        exitCode: result.exitCode,
        ...(retryExhausted ? CODIFIER_EVENT_COPY.exhausted : CODIFIER_EVENT_COPY.skipped),
      });
    }

    this.track("codifier_process_completed", startedAt, {
      status: "exhausted",
      attempts: options.maxRetries,
      goalId: goal.goalId,
    });
    return { status: "exhausted", goalId: goal.goalId, attempts: options.maxRetries };
  }

  async selectEligibleGoals(): Promise<GoalView[]> {
    const goals = await this.goalStatusReader.findByStatus(GoalStatus.QUALIFIED);
    const workerId = this.workerIdentityReader.workerId;

    return goals
      .filter((goal) => this.claimPolicy.canClaim(goal.goalId, workerId).allowed)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  buildPrompt(goalId: string): string {
    return [
      `Run the Jumbo codification workflow for goal ${goalId}.`,
      `Execute: jumbo goal codify --id ${goalId}`,
      "Review the codification instructions, reconcile any architectural context changes, then close the goal with:",
      `jumbo goal close --id ${goalId}`,
    ].join(" ");
  }

  private async isGoalDone(goalId: string): Promise<boolean> {
    const goal = await this.goalReader.findById(goalId);
    return goal?.status === GoalStatus.DONE;
  }

  private emit(options: CodifierProcessOptions, event: CodifierProcessEvent): void {
    options.emit?.(event);
  }

  private emitFailure(
    options: CodifierProcessOptions,
    goalId: string,
    error: unknown,
  ): void {
    this.emit(options, {
      daemon: CODIFIER_EVENT_SOURCE,
      status: "failed",
      source: CODIFIER_EVENT_SOURCE,
      goalId,
      ...CODIFIER_EVENT_COPY.failed,
      ...this.errorProperties(error),
    });
  }

  private track(
    eventName: string,
    startedAt: bigint,
    properties: Record<string, unknown>,
  ): void {
    this.telemetryClient.track(eventName, {
      daemon: "codifier",
      durationMs: Number((process.hrtime.bigint() - startedAt) / BigInt(1_000_000)),
      ...properties,
    });
  }

  private errorProperties(error: unknown): {
    errorType: string;
    errorMessage: string;
    errorStack?: string;
  } {
    if (error instanceof Error) {
      return {
        errorType: error.name,
        errorMessage: limitTextTail(error.message, CODIFIER_EVENT_TEXT_FIELD_MAX_LENGTH),
        errorStack: error.stack === undefined
          ? undefined
          : limitTextTail(error.stack, CODIFIER_EVENT_TEXT_FIELD_MAX_LENGTH),
      };
    }

    return {
      errorType: "UnknownError",
      errorMessage: limitTextTail(String(error), CODIFIER_EVENT_TEXT_FIELD_MAX_LENGTH),
    };
  }
}

function limitTextTail(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(-maxLength) : value;
}
