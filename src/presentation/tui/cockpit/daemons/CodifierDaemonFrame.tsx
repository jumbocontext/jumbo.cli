import React from "react";
import { getCodifierFrame } from "../CockpitDaemonFrames.js";
import { CodifierGlyphDaemonFrame } from "../CodifierGlyphDaemonFrame.js";
import type { IDaemonFrame } from "./IDaemonFrame.js";

export function CodifierDaemonFrame({
  frameIndex,
  snapshot,
  statusLabel,
  codifierGlyphColors,
}: IDaemonFrame): React.ReactElement {
  return (
    <CodifierGlyphDaemonFrame
      frame={getCodifierFrame(frameIndex)}
      frameIndex={frameIndex}
      glyphColors={codifierGlyphColors}
      snapshot={snapshot}
      statusLabel={statusLabel}
    />
  );
}
