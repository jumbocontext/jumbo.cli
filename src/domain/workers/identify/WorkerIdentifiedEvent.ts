import { BaseEvent } from "../../BaseEvent.js";
import { WorkerMode } from "../../../application/host/workers/WorkerMode.js";

export const WorkerEventType = {
  IDENTIFIED: "WorkerIdentifiedEvent",
} as const;

/**
 * Emitted when a worker is identified via its host session key.
 * Creates or re-identifies a worker in the system.
 */
export interface WorkerIdentifiedEvent extends BaseEvent {
  readonly type: typeof WorkerEventType.IDENTIFIED;
  readonly payload: {
    readonly hostSessionKey: string;
    readonly mode: WorkerMode;
  };
}
