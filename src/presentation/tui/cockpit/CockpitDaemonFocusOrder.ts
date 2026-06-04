import type { TuiDaemonName } from "../daemon-subprocesses/ISubprocessManager.js";

export function getNextFocusedCockpitDaemon(
  currentDaemon: TuiDaemonName,
  focusOrder: readonly TuiDaemonName[],
): TuiDaemonName {
  const currentIndex = focusOrder.indexOf(currentDaemon);
  const nextIndex = currentIndex === -1
    ? 0
    : (currentIndex + 1) % focusOrder.length;

  return focusOrder[nextIndex];
}
