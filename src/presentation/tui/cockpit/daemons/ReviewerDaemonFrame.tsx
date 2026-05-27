import React from "react";
import { GlyphCellDaemonFrame } from "../DaemonFrameViews.js";
import { getReviewerFrame } from "../CockpitDaemonFrames.js";
import type { IDaemonFrame } from "./IDaemonFrame.js";

export function ReviewerDaemonFrame({
  frameIndex,
  snapshot,
  statusLabel,
  reviewerGlyphPalette,
}: IDaemonFrame): React.ReactElement {
  return (
    <GlyphCellDaemonFrame
      frame={getReviewerFrame(frameIndex, reviewerGlyphPalette)}
      frameIndex={frameIndex}
      snapshot={snapshot}
      statusLabel={statusLabel}
    />
  );
}
