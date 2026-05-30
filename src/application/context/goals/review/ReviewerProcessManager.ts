import { IAgentGateway } from "../../../agents/IAgentGateway.js";
import { IProcessManager, ProcessManagerEvent, ProcessManagerOptions, ProcessManagerResult } from "../../../daemons/IProcessManager.js";
import { IWorkerIdentityReader } from "../../../host/workers/IWorkerIdentityReader.js";
import { ITelemetryClient } from "../../../telemetry/ITelemetryClient.js";
import { GoalStatus } from "../../../../domain/goals/Constants.js";
import { GoalView } from "../GoalView.js";
import { IGoalStatusReader } from "../IGoalStatusReader.js";
import { GoalClaimPolicy } from "../claims/GoalClaimPolicy.js";
import { ReviewGoalController } from "./ReviewGoalController.js";
import { IGoalSubmitForReviewReader } from "./IGoalSubmitForReviewReader.js";

const REVIEW_COMPLETE_STATUSES = new Set<string>([GoalStatus.QUALIFIED, GoalStatus.REJECTED]);
const REVIEWER_EVENT_SOURCE = "reviewer";
const REVIEWER_EVENT_TEXT_FIELD_MAX_LENGTH = 2_048;
const REVIEWER_EVENT_COPY = {
  noWork: {
    category: "waiting",
    message: "awaiting submitted goals",
  },
  workStarted: {
    category: "work-started",
    message: "reviewing goal",
  },
  completed: {
    category: "completed",
    message: "review completed",
  },
  skipped: {
    category: "skipped",
    message: "review not completed after agent attempt",
  },
  exhausted: {
    category: "exhausted",
    message: "review attempts exhausted",
  },
  failed: {
    category: "failed",
    message: "review failed",
  },
} as const;

export class ReviewerProcessManager implements IProcessManager {
  constructor(
    private readonly goalStatusReader: IGoalStatusReader,
    private readonly goalReader: IGoalSubmitForReviewReader,
    private readonly claimPolicy: GoalClaimPolicy,
    private readonly workerIdentityReader: IWorkerIdentityReader,
    private readonly reviewGoalController: ReviewGoalController,
    private readonly agentGateway: IAgentGateway,
    private readonly telemetryClient: ITelemetryClient,
  ) {}

  async processNext(options: ProcessManagerOptions): Promise<ProcessManagerResult> {
    const startedAt = process.hrtime.bigint();
    const goals = await this.selectEligibleGoals();

    if (goals.length === 0) {
      this.emit(options, {
        daemon: REVIEWER_EVENT_SOURCE,
        status: "idle",
        source: REVIEWER_EVENT_SOURCE,
        ...REVIEWER_EVENT_COPY.noWork,
      });
      this.track(startedAt, { status: "idle", attempts: 0 });
      return { status: "idle", attempts: 0 };
    }

    const goal = goals[0];

    try {
      await this.reviewGoalController.handle({ goalId: goal.goalId });
    } catch (error) {
      const errorProperties = this.errorProperties(error);
      this.emit(options, {
        daemon: REVIEWER_EVENT_SOURCE,
        status: "failed",
        source: REVIEWER_EVENT_SOURCE,
        goalId: goal.goalId,
        ...REVIEWER_EVENT_COPY.failed,
        ...errorProperties,
      });
      this.track(startedAt, { status: "failed", attempts: 0, goalId: goal.goalId, ...errorProperties });
      return { status: "failed", goalId: goal.goalId, attempts: 0 };
    }

    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      this.emit(options, {
        daemon: REVIEWER_EVENT_SOURCE,
        status: "processing",
        source: REVIEWER_EVENT_SOURCE,
        goalId: goal.goalId,
        attempt,
        maxRetries: options.maxRetries,
        ...REVIEWER_EVENT_COPY.workStarted,
      });
      const result = await this.agentGateway.invoke({ agentId: options.agentId, prompt: this.buildPrompt(goal.goalId) });
      this.emitModelOutput(options, goal.goalId, result.stdout);

      if (await this.isReviewComplete(goal.goalId)) {
        this.emit(options, {
          daemon: REVIEWER_EVENT_SOURCE,
          status: "completed",
          source: REVIEWER_EVENT_SOURCE,
          goalId: goal.goalId,
          attempt,
          maxRetries: options.maxRetries,
          exitCode: result.exitCode,
          ...REVIEWER_EVENT_COPY.completed,
        });
        this.track(startedAt, { status: "completed", attempts: attempt, goalId: goal.goalId, agentExitCode: result.exitCode });
        return { status: "completed", goalId: goal.goalId, attempts: attempt };
      }

      const retryExhausted = attempt === options.maxRetries;
      this.emit(options, {
        daemon: REVIEWER_EVENT_SOURCE,
        status: retryExhausted ? "exhausted" : "skipped",
        source: REVIEWER_EVENT_SOURCE,
        goalId: goal.goalId,
        attempt,
        maxRetries: options.maxRetries,
        exitCode: result.exitCode,
        ...(retryExhausted ? REVIEWER_EVENT_COPY.exhausted : REVIEWER_EVENT_COPY.skipped),
      });
    }

    this.track(startedAt, { status: "exhausted", attempts: options.maxRetries, goalId: goal.goalId });
    return { status: "exhausted", goalId: goal.goalId, attempts: options.maxRetries };
  }

  async selectEligibleGoals(): Promise<GoalView[]> {
    const goals = await this.goalStatusReader.findByStatus(GoalStatus.SUBMITTED);
    const workerId = this.workerIdentityReader.workerId;
    return goals
      .filter((goal) => this.claimPolicy.canClaim(goal.goalId, workerId).allowed)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  buildPrompt(goalId: string): string {
    return `Run the Jumbo review workflow for goal ${goalId}. Execute: jumbo goal review --id ${goalId}`;
  }

  private async isReviewComplete(goalId: string): Promise<boolean> {
    const goal = await this.goalReader.findById(goalId);
    return REVIEW_COMPLETE_STATUSES.has(goal?.status ?? "unknown");
  }

  private emit(options: ProcessManagerOptions, event: ProcessManagerEvent): void {
    options.emit?.(event);
  }

  private emitModelOutput(
    options: ProcessManagerOptions,
    goalId: string,
    stdout: string | undefined,
  ): void {
    if (stdout === undefined) {
      return;
    }

    const lines = stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    for (const line of lines) {
      this.emit(options, {
        daemon: REVIEWER_EVENT_SOURCE,
        status: "processing",
        source: REVIEWER_EVENT_SOURCE,
        category: "model-output",
        message: limitTextTail(line, REVIEWER_EVENT_TEXT_FIELD_MAX_LENGTH),
        goalId,
      });
    }
  }

  private track(startedAt: bigint, properties: Record<string, unknown>): void {
    this.telemetryClient.track("reviewer_process_completed", {
      daemon: "reviewer",
      durationMs: Number((process.hrtime.bigint() - startedAt) / BigInt(1_000_000)),
      ...properties,
    });
  }

  private errorProperties(error: unknown): { errorType: string; errorMessage: string; errorStack?: string } {
    if (error instanceof Error) {
      return {
        errorType: error.name,
        errorMessage: limitTextTail(error.message, REVIEWER_EVENT_TEXT_FIELD_MAX_LENGTH),
        errorStack: error.stack === undefined
          ? undefined
          : limitTextTail(error.stack, REVIEWER_EVENT_TEXT_FIELD_MAX_LENGTH),
      };
    }
    return {
      errorType: "UnknownError",
      errorMessage: limitTextTail(String(error), REVIEWER_EVENT_TEXT_FIELD_MAX_LENGTH),
    };
  }
}

function limitTextTail(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(-maxLength) : value;
}
