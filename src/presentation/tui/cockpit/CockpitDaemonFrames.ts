import { CodifierFrameFactory } from "./CodifierFrameFactory.js";
import { DaemonFrameDimensions } from "./DaemonFrameDimensions.js";
import type {
  DaemonFrameGlyphCell,
  DaemonFrameGlyphColorMap,
  DaemonFrameGlyphPalette,
  DaemonFrameGlyphStyle,
} from "./DaemonFrameGlyphTypes.js";
import { DaemonFrameStatusOverlay } from "./DaemonFrameStatusOverlay.js";
import { getGlyphCellSegments } from "./GlyphCellSegments.js";
import { RandomGlyphFrameFactory } from "./RandomGlyphFrameFactory.js";
import { RenderedDaemonFrame } from "./RenderedDaemonFrame.js";
import { getStyledGlyphSegments } from "./StyledGlyphSegments.js";

export type GlyphStyle = DaemonFrameGlyphStyle;
export type GlyphColorMap = DaemonFrameGlyphColorMap;
export type GlyphPalette = DaemonFrameGlyphPalette;
export type GlyphCell = DaemonFrameGlyphCell;

export const RENDERED_DAEMON_FRAME_HEIGHT =
  DaemonFrameDimensions.renderedFrameHeight;
export const DAEMON_PANEL_CONTENT_WIDTH =
  DaemonFrameDimensions.panelContentWidth;
export const REFINER_FRAME_COUNT = RandomGlyphFrameFactory.refinerFrameCount;
export const REVIEWER_FRAME_COUNT = RandomGlyphFrameFactory.reviewerFrameCount;
export const CODIFIER_FRAME_COUNT = CodifierFrameFactory.frameCount;
export const DEFAULT_REFINER_FRAME_DURATION_MS =
  RandomGlyphFrameFactory.defaultRefinerFrameDurationMs;
export const DEFAULT_REVIEWER_FRAME_DURATION_MS =
  RandomGlyphFrameFactory.defaultReviewerFrameDurationMs;
export const DEFAULT_CODIFIER_FRAME_DURATION_MS =
  CodifierFrameFactory.defaultFrameDurationMs;
export const DEFAULT_RANDOM_GLYPH_COLORS =
  RandomGlyphFrameFactory.defaultGlyphColors;
export const DEFAULT_CODIFIER_GLYPH_COLORS =
  CodifierFrameFactory.defaultGlyphColors;

export function getRenderedDaemonFrame<T>(frame: readonly T[]): readonly T[] {
  return RenderedDaemonFrame.getFrame(frame);
}

export function getRenderedFrameIndex(
  ...parameters: Parameters<typeof RenderedDaemonFrame.getIndex>
): ReturnType<typeof RenderedDaemonFrame.getIndex> {
  return RenderedDaemonFrame.getIndex(...parameters);
}

export function isDaemonStatusLine(
  ...parameters: Parameters<typeof DaemonFrameStatusOverlay.isLine>
): ReturnType<typeof DaemonFrameStatusOverlay.isLine> {
  return DaemonFrameStatusOverlay.isLine(...parameters);
}

export function getGlyphCellLinePrefix(
  ...parameters: Parameters<typeof DaemonFrameStatusOverlay.getGlyphCellPrefix>
): ReturnType<typeof DaemonFrameStatusOverlay.getGlyphCellPrefix> {
  return DaemonFrameStatusOverlay.getGlyphCellPrefix(...parameters);
}

export function getGlyphCellLineSuffix(
  ...parameters: Parameters<typeof DaemonFrameStatusOverlay.getGlyphCellSuffix>
): ReturnType<typeof DaemonFrameStatusOverlay.getGlyphCellSuffix> {
  return DaemonFrameStatusOverlay.getGlyphCellSuffix(...parameters);
}

export function getGlyphLinePrefix(
  ...parameters: Parameters<typeof DaemonFrameStatusOverlay.getGlyphTextPrefix>
): ReturnType<typeof DaemonFrameStatusOverlay.getGlyphTextPrefix> {
  return DaemonFrameStatusOverlay.getGlyphTextPrefix(...parameters);
}

export function getGlyphLineSuffix(
  ...parameters: Parameters<typeof DaemonFrameStatusOverlay.getGlyphTextSuffix>
): ReturnType<typeof DaemonFrameStatusOverlay.getGlyphTextSuffix> {
  return DaemonFrameStatusOverlay.getGlyphTextSuffix(...parameters);
}

export function getCodifierFrame(
  ...parameters: Parameters<typeof CodifierFrameFactory.getFrame>
): ReturnType<typeof CodifierFrameFactory.getFrame> {
  return CodifierFrameFactory.getFrame(...parameters);
}

export function getReviewerFrame(
  ...parameters: Parameters<typeof RandomGlyphFrameFactory.getReviewerFrame>
): ReturnType<typeof RandomGlyphFrameFactory.getReviewerFrame> {
  return RandomGlyphFrameFactory.getReviewerFrame(...parameters);
}

export function getRefinerFrame(
  ...parameters: Parameters<typeof RandomGlyphFrameFactory.getRefinerFrame>
): ReturnType<typeof RandomGlyphFrameFactory.getRefinerFrame> {
  return RandomGlyphFrameFactory.getRefinerFrame(...parameters);
}

export { getGlyphCellSegments, getStyledGlyphSegments };
