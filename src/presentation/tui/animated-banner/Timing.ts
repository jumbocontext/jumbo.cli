import { getFrameCount } from "../../cli/banner/AnimationFrames.js";

const totalFrames = getFrameCount();

export const AnimatedBannerTiming = {
  totalFrames,
  midpointFrame: Math.floor(totalFrames / 2),
  frameDurationMs: 9,
  tickMs: 4,
  holdDelayMs: 1120,
  eraseIntervalMs: 15,
} as const;
