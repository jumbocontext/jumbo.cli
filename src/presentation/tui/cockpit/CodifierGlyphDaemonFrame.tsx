import React from "react";
import { Box, Text } from "ink";
import type { CockpitDaemonSnapshot } from "./CockpitDaemonSnapshot.js";
import {
  DAEMON_PANEL_CONTENT_WIDTH,
  getGlyphLinePrefix,
  getGlyphLineSuffix,
  getRenderedDaemonFrame,
  getStyledGlyphSegments,
  isDaemonStatusLine,
  type GlyphColorMap,
} from "./CockpitDaemonFrames.js";
import { DaemonFrameStatusColor } from "./DaemonFrameStatusColor.js";

export function CodifierGlyphDaemonFrame({
  frame,
  frameIndex,
  glyphColors,
  snapshot,
  statusLabel,
}: {
  readonly frame: readonly string[];
  readonly frameIndex: number;
  readonly glyphColors: GlyphColorMap;
  readonly snapshot: CockpitDaemonSnapshot;
  readonly statusLabel: string;
}): React.ReactElement {
  return (
    <Box flexDirection="column" flexWrap="nowrap" width={DAEMON_PANEL_CONTENT_WIDTH}>
      {getRenderedDaemonFrame(frame).map((line, lineIndex) => (
        <Text key={`${frameIndex}-${lineIndex}`}>
          {getStyledGlyphSegments(
            getGlyphLinePrefix(line, statusLabel, lineIndex),
            glyphColors,
            snapshot,
          ).map((segment, segmentIndex) => (
            <Text
              key={`${frameIndex}-${lineIndex}-prefix-${segmentIndex}`}
              color={segment.color}
              dimColor={segment.dimColor}
            >
              {segment.text}
            </Text>
          ))}
          {isDaemonStatusLine(lineIndex) && (
            <Text color={DaemonFrameStatusColor} bold>
              {statusLabel}
            </Text>
          )}
          {getStyledGlyphSegments(
            getGlyphLineSuffix(line, statusLabel, lineIndex),
            glyphColors,
            snapshot,
          ).map((segment, segmentIndex) => (
            <Text
              key={`${frameIndex}-${lineIndex}-suffix-${segmentIndex}`}
              color={segment.color}
              dimColor={segment.dimColor}
            >
              {segment.text}
            </Text>
          ))}
        </Text>
      ))}
    </Box>
  );
}
