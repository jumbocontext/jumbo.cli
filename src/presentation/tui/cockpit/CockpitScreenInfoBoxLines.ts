import { generateCustomInfoBoxLines } from "../../cli/banner/AnimationFrames.js";
import { ProjectLifecycle } from "../../../domain/project/Constants.js";
import { CockpitScreenCopy } from "./CockpitScreenCopy.js";
import type { CockpitState } from "./CockpitState.js";

export function getCockpitScreenInfoBoxLines(
  state: CockpitState,
  currentDirectory?: string,
): string[] | undefined {
  if (state === ProjectLifecycle.UNINITIALIZED) {
    return generateCustomInfoBoxLines([
      {
        label: CockpitScreenCopy.directoryLabel,
        value: currentDirectory ?? process.cwd(),
      },
      {
        label: CockpitScreenCopy.statusLabel,
        value: CockpitScreenCopy.uninitializedStatus,
      },
    ]);
  }

  if (state === ProjectLifecycle.UNPRIMED) {
    return generateCustomInfoBoxLines([
      {
        label: CockpitScreenCopy.directoryLabel,
        value: currentDirectory ?? process.cwd(),
      },
      {
        label: CockpitScreenCopy.statusLabel,
        value: CockpitScreenCopy.readyStatus,
      },
    ]);
  }

  return undefined;
}
