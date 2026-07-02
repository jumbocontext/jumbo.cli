import type {
  DaemonEventSnapshot,
  SubprocessSnapshot,
} from "../daemon-subprocesses/ISubprocessManager.js";

const DAEMON_EVENT_MESSAGE_WIDTH = 52;

export const DaemonEventRowMessageFormatter = {
  format,
} as const;

function format(
  snapshot: SubprocessSnapshot,
  event: DaemonEventSnapshot,
): string {
  const parts = [
    event.message === undefined || event.message.trim().length === 0
      ? undefined
      : event.message.trim(),
    event.goalId === undefined ? undefined : shortGoalId(event.goalId),
    formatAttemptDetails(event),
    formatExitDetails(event),
    event.errorMessage ?? snapshot.stderr[snapshot.stderr.length - 1],
  ].filter((part): part is string => part !== undefined && part.length > 0);

  return truncateTail(parts.join(" "), DAEMON_EVENT_MESSAGE_WIDTH);
}

function formatAttemptDetails(event: DaemonEventSnapshot): string | undefined {
  if (event.attempt === undefined && event.maxRetries === undefined) {
    return undefined;
  }

  return `${event.attempt ?? "-"}/${event.maxRetries ?? "-"}`;
}

function formatExitDetails(event: DaemonEventSnapshot): string | undefined {
  return event.exitCode === undefined ? undefined : `exit ${event.exitCode}`;
}

function shortGoalId(goalId: string | undefined): string {
  if (goalId === undefined) {
    return "-";
  }
  return goalId.length > 8 ? goalId.slice(0, 8) : goalId;
}

function truncateTail(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max - 3) + "...";
}
