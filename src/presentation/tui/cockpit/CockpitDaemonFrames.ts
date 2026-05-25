import { BaseColors } from "../../shared/DesignTokens.js";
import type { TuiSubprocessSnapshot } from "../daemon-subprocesses/ISubprocessManager.js";

export interface GlyphStyle {
  readonly color: string;
  readonly dimColor?: boolean;
}

export type GlyphColorMap = Readonly<Record<string, string>>;
export type GlyphPalette = readonly string[];

export interface GlyphCell {
  readonly glyph: string;
  readonly color: string;
}

interface RandomGlyphFrameConfig {
  readonly frameCount: number;
  readonly gridWidth: number;
  readonly gridHeight: number;
  readonly glyphs: readonly string[];
}

export const RENDERED_DAEMON_FRAME_HEIGHT = 5;
export const DAEMON_PANEL_CONTENT_WIDTH = 35;
export const REFINER_FRAME_COUNT = 9;
export const REVIEWER_FRAME_COUNT = 6;
export const CODIFIER_FRAME_COUNT = 6;
export const DEFAULT_REFINER_FRAME_DURATION_MS = 500;
export const DEFAULT_REVIEWER_FRAME_DURATION_MS = 350;
export const DEFAULT_CODIFIER_FRAME_DURATION_MS = 200;

const RANDOM_GLYPH_GRID_HEIGHT = 10;
const CODIFIER_GRID_HEIGHT = 10;
const CODIFIER_GROUP_LENGTH = 4;
const CODIFIER_ROW_REPEAT_COUNT = 7;
const DEFAULT_CODIFIER_GLYPH_STYLE: GlyphStyle = {
  color: BaseColors.shade3,
  dimColor: false,
};
const REFINER_GLYPHS = ["•"] as const;
const REVIEWER_GLYPHS = ["─","│","■","▢"] as const;
const CODIFIER_ALPHANUMERIC_GLYPHS = [
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
] as const;

export const DEFAULT_RANDOM_GLYPH_COLORS = [
  BaseColors.tint1,
  BaseColors.primary,
  BaseColors.shade1,
  BaseColors.shade2,
  BaseColors.shade3,
  BaseColors.shade4,
  BaseColors.shade5,
  BaseColors.shade6,
] as const;

export const DEFAULT_CODIFIER_GLYPH_COLORS: GlyphColorMap = {
  "█": BaseColors.shade1,
  "░": BaseColors.shade2,
};

const REFINER_GLYPH_FRAME_CONFIG = {
  frameCount: REFINER_FRAME_COUNT,
  gridWidth: DAEMON_PANEL_CONTENT_WIDTH,
  gridHeight: RANDOM_GLYPH_GRID_HEIGHT,
  glyphs: REFINER_GLYPHS,
} as const satisfies RandomGlyphFrameConfig;

const REVIEWER_GLYPH_FRAME_CONFIG = {
  frameCount: REVIEWER_FRAME_COUNT,
  gridWidth: DAEMON_PANEL_CONTENT_WIDTH,
  gridHeight: RANDOM_GLYPH_GRID_HEIGHT,
  glyphs: REVIEWER_GLYPHS,
} as const satisfies RandomGlyphFrameConfig;

export function getRenderedDaemonFrame<T>(frame: readonly T[]): readonly T[] {
  return frame.slice(0, RENDERED_DAEMON_FRAME_HEIGHT);
}

export function getRenderedFrameIndex(
  snapshot: TuiSubprocessSnapshot,
  animatedFrameIndex: number,
): number {
  return snapshot.status === "running" ? animatedFrameIndex : 0;
}

export function isDaemonStatusLine(lineIndex: number): boolean {
  return lineIndex === Math.floor(RENDERED_DAEMON_FRAME_HEIGHT / 2);
}

export function getGlyphCellLinePrefix(
  line: readonly GlyphCell[],
  statusLabel: string,
  lineIndex: number,
): readonly GlyphCell[] {
  if (!isDaemonStatusLine(lineIndex)) {
    return line;
  }

  return line.slice(0, getDaemonStatusOverlayStart(line.length, statusLabel));
}

export function getGlyphCellLineSuffix(
  line: readonly GlyphCell[],
  statusLabel: string,
  lineIndex: number,
): readonly GlyphCell[] {
  if (!isDaemonStatusLine(lineIndex)) {
    return [];
  }

  return line.slice(getDaemonStatusOverlayEnd(line.length, statusLabel));
}

export function getGlyphLinePrefix(
  line: string,
  statusLabel: string,
  lineIndex: number,
): string {
  if (!isDaemonStatusLine(lineIndex)) {
    return line;
  }

  return line.slice(0, getDaemonStatusOverlayStart(line.length, statusLabel));
}

export function getGlyphLineSuffix(
  line: string,
  statusLabel: string,
  lineIndex: number,
): string {
  if (!isDaemonStatusLine(lineIndex)) {
    return "";
  }

  return line.slice(getDaemonStatusOverlayEnd(line.length, statusLabel));
}

export function getCodifierFrame(index: number): string[] {
  if (index < 0 || index >= CODIFIER_FRAME_COUNT) {
    return ["error"];
  }

  const random = createSeededRandom(createSeed(
    index + CODIFIER_FRAME_COUNT,
    DAEMON_PANEL_CONTENT_WIDTH * CODIFIER_GRID_HEIGHT,
  ));

  return Array.from({ length: CODIFIER_GRID_HEIGHT }, () => {
    const groups = new Set<string>();

    while (groups.size < CODIFIER_ROW_REPEAT_COUNT) {
      groups.add(
        Array.from({ length: CODIFIER_GROUP_LENGTH }, () =>
          pickRandomValue(CODIFIER_ALPHANUMERIC_GLYPHS, random)
        ).join("")
      );
    }

    return Array.from(groups).map((group) => `${group}.`).join("");
  });
}

export function getReviewerFrame(
  index: number,
  glyphPalette: GlyphPalette,
): GlyphCell[][] {
  return getRandomGlyphFrame(index, glyphPalette, REVIEWER_GLYPH_FRAME_CONFIG);
}

export function getRefinerFrame(
  index: number,
  glyphPalette: GlyphPalette,
): GlyphCell[][] {
  return getRandomGlyphFrame(index, glyphPalette, REFINER_GLYPH_FRAME_CONFIG);
}

export function getGlyphCellSegments(
  line: readonly GlyphCell[],
  snapshot: TuiSubprocessSnapshot,
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

export function getStyledGlyphSegments(
  line: string,
  glyphColors: GlyphColorMap,
  snapshot: TuiSubprocessSnapshot,
): Array<GlyphStyle & { text: string }> {
  const segments: Array<GlyphStyle & { text: string }> = [];

  for (const character of line) {
    const glyphStyle = getGlyphStyle(character, glyphColors, snapshot);
    const previousSegment = segments[segments.length - 1];

    if (
      previousSegment !== undefined
      && previousSegment.color === glyphStyle.color
      && previousSegment.dimColor === glyphStyle.dimColor
    ) {
      previousSegment.text += character;
      continue;
    }

    segments.push({
      text: character,
      color: glyphStyle.color,
      dimColor: glyphStyle.dimColor,
    });
  }

  return segments;
}

function getRandomGlyphFrame(
  index: number,
  glyphPalette: GlyphPalette,
  config: RandomGlyphFrameConfig,
): GlyphCell[][] {
  if (index < 0 || index >= config.frameCount) {
    return [[{ glyph: "error", color: DEFAULT_CODIFIER_GLYPH_STYLE.color }]];
  }

  const glyphGrid = createRandomGlyphGrid(index, glyphPalette, config);

  return Array.from({ length: config.gridHeight }, (_, rowIndex) => {
    const start = rowIndex * config.gridWidth;
    return glyphGrid.slice(start, start + config.gridWidth);
  });
}

function getDaemonStatusOverlayStart(
  lineLength: number,
  statusLabel: string,
): number {
  return Math.max(0, Math.floor((lineLength - statusLabel.length) / 2));
}

function getDaemonStatusOverlayEnd(
  lineLength: number,
  statusLabel: string,
): number {
  return Math.min(lineLength, getDaemonStatusOverlayStart(lineLength, statusLabel) + statusLabel.length);
}

function getGlyphStyle(
  character: string,
  glyphColors: GlyphColorMap,
  snapshot: TuiSubprocessSnapshot,
): GlyphStyle {
  const color = glyphColors[character];

  if (color === undefined) {
    return {
      ...DEFAULT_CODIFIER_GLYPH_STYLE,
      color: getDaemonGlyphColor(snapshot, DEFAULT_CODIFIER_GLYPH_STYLE.color),
    };
  }

  return { color: getDaemonGlyphColor(snapshot, color) };
}

function getDaemonGlyphColor(
  snapshot: TuiSubprocessSnapshot,
  animatedColor: string,
): string {
  return snapshot.status === "running" ? animatedColor : BaseColors.shade6;
}

function createRandomGlyphGrid(
  frameIndex: number,
  glyphPalette: GlyphPalette,
  config: RandomGlyphFrameConfig,
): GlyphCell[] {
  const gridSize = config.gridWidth * config.gridHeight;
  const random = createSeededRandom(createSeed(frameIndex, gridSize));

  return Array.from({ length: gridSize }, () => ({
    glyph: pickRandomValue(config.glyphs, random),
    color: pickRandomValue(glyphPalette, random),
  }));
}

function createSeed(frameIndex: number, gridSize: number): number {
  return (frameIndex + 1) * 1009 + gridSize * 9176;
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function pickRandomValue<T>(values: readonly T[], random: () => number): T {
  return values[Math.floor(random() * values.length)];
}
