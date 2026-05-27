import React from "react";
import { GlyphCellDaemonFrame } from "../DaemonFrameViews.js";
import { getRefinerFrame } from "../CockpitDaemonFrames.js";
import type { IDaemonFrame } from "./IDaemonFrame.js";

export function RefinerDaemonFrame({
  frameIndex,
  snapshot,
  statusLabel,
  refinerGlyphPalette,
}: IDaemonFrame): React.ReactElement {
  return (
    <GlyphCellDaemonFrame
      frame={getRefinerFrame(frameIndex, refinerGlyphPalette)}
      frameIndex={frameIndex}
      snapshot={snapshot}
      statusLabel={statusLabel}
    />
  );
}
