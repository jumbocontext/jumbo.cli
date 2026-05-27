import React from "react";
import { CodifierDaemonFrame as CodifierDaemonFrameView } from "../DaemonFrameViews.js";
import { getCodifierFrame } from "../CockpitDaemonFrames.js";
import type { IDaemonFrame } from "./IDaemonFrame.js";

export function CodifierDaemonFrame({
  frameIndex,
  snapshot,
  statusLabel,
  codifierGlyphColors,
}: IDaemonFrame): React.ReactElement {
  return (
    <CodifierDaemonFrameView
      frame={getCodifierFrame(frameIndex)}
      frameIndex={frameIndex}
      glyphColors={codifierGlyphColors}
      snapshot={snapshot}
      statusLabel={statusLabel}
    />
  );
}
