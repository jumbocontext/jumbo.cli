export const AnimatedBillboardPhase = {
  stickers: "stickers",
  finalPause: "finalPause",
  erasing: "erasing",
  done: "done",
} as const;

export type AnimatedBillboardPhase =
  (typeof AnimatedBillboardPhase)[keyof typeof AnimatedBillboardPhase];
