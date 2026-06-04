import { TuiSubprocessStatus } from "../daemon-subprocesses/TuiSubprocessStatus.js";
import type { CockpitDaemonSnapshot } from "./CockpitDaemonSnapshot.js";
import { DaemonFrameDimensions } from "./DaemonFrameDimensions.js";

export const RenderedDaemonFrame = {
  getFrame,
  getIndex,
} as const;

function getFrame<T>(frame: readonly T[]): readonly T[] {
  return frame.slice(0, DaemonFrameDimensions.renderedFrameHeight);
}

function getIndex(
  snapshot: CockpitDaemonSnapshot,
  animatedFrameIndex: number,
): number {
  return snapshot.status === TuiSubprocessStatus.RUNNING ? animatedFrameIndex : 0;
}
