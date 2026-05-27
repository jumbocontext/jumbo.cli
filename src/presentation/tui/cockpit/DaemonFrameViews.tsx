import React from "react";
import { Box, Text } from "ink";
import { BaseColors } from "../../shared/DesignTokens.js";
import type { CockpitDaemonSnapshot } from "./CockpitDaemonSnapshot.js";
import {
  DAEMON_PANEL_CONTENT_WIDTH,
  getGlyphCellLinePrefix,
  getGlyphCellLineSuffix,
  getGlyphCellSegments,
  getGlyphLinePrefix,
  getGlyphLineSuffix,
  getRenderedDaemonFrame,
  getStyledGlyphSegments,
  isDaemonStatusLine,
  type GlyphCell,
  type GlyphColorMap,
} from "./CockpitDaemonFrames.js";

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
            <Text color={getDaemonStatusColor()} bold>
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

export function CodifierDaemonFrame({
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
            <Text color={getDaemonStatusColor()} bold>
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

function getDaemonStatusColor(): string {
  return BaseColors.shade3;
}
