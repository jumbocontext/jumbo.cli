import { TuiDaemonEventCategory } from "./TuiDaemonEventCategory.js";
import type { TuiDaemonEventSnapshot } from "./TuiDaemonEventSnapshot.js";
import { TuiDaemonEventStatus } from "./TuiDaemonEventStatus.js";
import type { TuiDaemonName } from "./TuiDaemonName.js";

const EVENT_TEXT_FIELD_MAX_LENGTH = 2_048;

export class TuiDaemonOutputEventParser {
  parseOutputLine(
    daemon: TuiDaemonName,
    line: string,
  ): TuiDaemonEventSnapshot {
    const parsedEvent = this.parseStructuredEvent(line);

    if (parsedEvent !== null) {
      return this.boundEvent(parsedEvent);
    }

    return {
      daemon,
      status: TuiDaemonEventStatus.PROCESSING,
      source: daemon,
      category: TuiDaemonEventCategory.MODEL_OUTPUT,
      message: this.limitTextTail(line),
      timestampMs: Date.now(),
    };
  }

  boundTextField(value: string): string {
    return this.limitTextTail(value);
  }

  boundOptionalTextField(value: string | undefined): string | undefined {
    return value === undefined ? undefined : this.limitTextTail(value);
  }

  boundEvent(event: TuiDaemonEventSnapshot): TuiDaemonEventSnapshot {
    return {
      ...event,
      daemon: this.limitTextTail(event.daemon),
      status: this.limitTextTail(event.status),
      source: this.boundOptionalTextField(event.source),
      category: this.boundOptionalTextField(event.category),
      message: this.boundOptionalTextField(event.message),
      goalId: this.boundOptionalTextField(event.goalId),
      errorMessage: this.boundOptionalTextField(event.errorMessage),
    };
  }

  private parseStructuredEvent(line: string): TuiDaemonEventSnapshot | null {
    try {
      const parsed = JSON.parse(line) as TuiDaemonEventSnapshot;
      if (typeof parsed.daemon !== "string" || typeof parsed.status !== "string") {
        return null;
      }
      return {
        ...parsed,
        timestampMs: parsed.timestampMs ?? Date.now(),
      };
    } catch {
      return null;
    }
  }

  private limitTextTail(value: string): string {
    return value.length > EVENT_TEXT_FIELD_MAX_LENGTH
      ? value.slice(-EVENT_TEXT_FIELD_MAX_LENGTH)
      : value;
  }
}
