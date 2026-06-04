import React from "react";
import { Box, Text } from "ink";
import type { CockpitDaemonSnapshot } from "./CockpitDaemonSnapshot.js";
import {
  DAEMON_PANEL_CONTENT_WIDTH,
  getGlyphCellLinePrefix,
  getGlyphCellLineSuffix,
  getGlyphCellSegments,
  getRenderedDaemonFrame,
  isDaemonStatusLine,
  type GlyphCell,
} from "./CockpitDaemonFrames.js";
import { DaemonFrameStatusColor } from "./DaemonFrameStatusColor.js";

export function GlyphCellDaemonFrame({
  frame,
  frameIndex,
  snapshot,
  statusLabel,
}: {
  readonly frame: readonly (readonly GlyphCell[])[];
  readonly frameIndex: number;
  readonly snapshot: CockpitDaemonSnapshot;
  readonly statusLabel: string;
}): React.ReactElement {
  return (
    <Box flexDirection="column" flexWrap="nowrap" width={DAEMON_PANEL_CONTENT_WIDTH}>
      {getRenderedDaemonFrame(frame).map((line, lineIndex) => (
        <Text key={`${frameIndex}-${lineIndex}`}>
          {getGlyphCellSegments(
            getGlyphCellLinePrefix(line, statusLabel, lineIndex),
            snapshot,
          ).map((segment, segmentIndex) => (
            <Text
              key={`${frameIndex}-${lineIndex}-prefix-${segmentIndex}`}
              color={segment.color}
            >
              {segment.text}
            </Text>
          ))}
          {isDaemonStatusLine(lineIndex) && (
            <Text color={DaemonFrameStatusColor} bold>
              {statusLabel}
            </Text>
          )}
          {getGlyphCellSegments(
            getGlyphCellLineSuffix(line, statusLabel, lineIndex),
            snapshot,
          ).map((segment, segmentIndex) => (
            <Text
              key={`${frameIndex}-${lineIndex}-suffix-${segmentIndex}`}
              color={segment.color}
            >
              {segment.text}
            </Text>
          ))}
        </Text>
      ))}
    </Box>
  );
}
