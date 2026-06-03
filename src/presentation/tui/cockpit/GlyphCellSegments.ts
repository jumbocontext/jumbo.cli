import { BaseColors } from "../../shared/DesignTokens.js";
import { TuiSubprocessStatus } from "../daemon-subprocesses/TuiSubprocessStatus.js";
import type { CockpitDaemonSnapshot } from "./CockpitDaemonSnapshot.js";
import type { DaemonFrameGlyphCell } from "./DaemonFrameGlyphTypes.js";

export function getGlyphCellSegments(
  line: readonly DaemonFrameGlyphCell[],
  snapshot: CockpitDaemonSnapshot,
): Array<{ text: string; color: string }> {
  const segments: Array<{ text: string; color: string }> = [];

  for (const cell of line) {
    const color = getDaemonGlyphColor(snapshot, cell.color);
    const previousSegment = segments[segments.length - 1];

    if (previousSegment !== undefined && previousSegment.color === color) {
      previousSegment.text += cell.glyph;
      continue;
    }

    segments.push({ text: cell.glyph, color });
  }

  return segments;
}

function getDaemonGlyphColor(
  snapshot: CockpitDaemonSnapshot,
  animatedColor: string,
): string {
  return snapshot.status === TuiSubprocessStatus.RUNNING
    ? animatedColor
    : BaseColors.shade6;
}
