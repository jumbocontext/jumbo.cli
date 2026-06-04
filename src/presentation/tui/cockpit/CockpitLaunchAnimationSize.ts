export interface CockpitLaunchAnimationSize {
  readonly width: number;
  readonly height: number;
}

export function getCockpitLaunchAnimationSize(
  terminalWidth: number,
  terminalHeight: number,
): CockpitLaunchAnimationSize {
  return {
    height: Math.max(1, Math.floor(terminalHeight)),
    width: Math.max(1, Math.floor(terminalWidth)),
  };
}
