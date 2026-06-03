import { BaseColors } from "../../shared/DesignTokens.js";
import { DaemonFrameDimensions } from "./DaemonFrameDimensions.js";
import type {
  DaemonFrameGlyphCell,
  DaemonFrameGlyphPalette,
} from "./DaemonFrameGlyphTypes.js";

interface RandomGlyphFrameConfig {
  readonly frameCount: number;
  readonly gridWidth: number;
  readonly gridHeight: number;
  readonly glyphs: readonly string[];
}

const REFINER_GLYPHS = ["•"] as const;
const REVIEWER_GLYPHS = ["─", "│", "■", "▢"] as const;

const REFINER_GLYPH_FRAME_CONFIG = {
  frameCount: DaemonFrameDimensions.refinerFrameCount,
  gridWidth: DaemonFrameDimensions.panelContentWidth,
  gridHeight: DaemonFrameDimensions.randomGlyphGridHeight,
  glyphs: REFINER_GLYPHS,
} as const satisfies RandomGlyphFrameConfig;

const REVIEWER_GLYPH_FRAME_CONFIG = {
  frameCount: DaemonFrameDimensions.reviewerFrameCount,
  gridWidth: DaemonFrameDimensions.panelContentWidth,
  gridHeight: DaemonFrameDimensions.randomGlyphGridHeight,
  glyphs: REVIEWER_GLYPHS,
} as const satisfies RandomGlyphFrameConfig;

const DEFAULT_RANDOM_GLYPH_COLORS = [
  BaseColors.tint1,
  BaseColors.primary,
  BaseColors.shade1,
  BaseColors.shade2,
  BaseColors.shade3,
  BaseColors.shade4,
  BaseColors.shade5,
  BaseColors.shade6,
] as const;

export const RandomGlyphFrameFactory = {
  defaultGlyphColors: DEFAULT_RANDOM_GLYPH_COLORS,
  refinerFrameCount: DaemonFrameDimensions.refinerFrameCount,
  reviewerFrameCount: DaemonFrameDimensions.reviewerFrameCount,
  defaultRefinerFrameDurationMs:
    DaemonFrameDimensions.defaultRefinerFrameDurationMs,
  defaultReviewerFrameDurationMs:
    DaemonFrameDimensions.defaultReviewerFrameDurationMs,
  getRefinerFrame: (
    index: number,
    glyphPalette: DaemonFrameGlyphPalette,
  ): DaemonFrameGlyphCell[][] =>
    getRandomGlyphFrame(index, glyphPalette, REFINER_GLYPH_FRAME_CONFIG),
  getReviewerFrame: (
    index: number,
    glyphPalette: DaemonFrameGlyphPalette,
  ): DaemonFrameGlyphCell[][] =>
    getRandomGlyphFrame(index, glyphPalette, REVIEWER_GLYPH_FRAME_CONFIG),
} as const;

function getRandomGlyphFrame(
  index: number,
  glyphPalette: DaemonFrameGlyphPalette,
  config: RandomGlyphFrameConfig,
): DaemonFrameGlyphCell[][] {
  if (index < 0 || index >= config.frameCount) {
    return [[{ glyph: "error", color: BaseColors.shade3 }]];
  }

  const glyphGrid = createRandomGlyphGrid(index, glyphPalette, config);

  return Array.from({ length: config.gridHeight }, (_, rowIndex) => {
    const start = rowIndex * config.gridWidth;
    return glyphGrid.slice(start, start + config.gridWidth);
  });
}

function createRandomGlyphGrid(
  frameIndex: number,
  glyphPalette: DaemonFrameGlyphPalette,
  config: RandomGlyphFrameConfig,
): DaemonFrameGlyphCell[] {
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
