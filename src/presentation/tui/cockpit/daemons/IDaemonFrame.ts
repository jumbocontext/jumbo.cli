import type { CockpitDaemonSnapshot } from "../CockpitDaemonSnapshot.js";
import type { GlyphColorMap, GlyphPalette } from "../CockpitDaemonFrames.js";

export interface IDaemonFrame {
  readonly frameIndex: number;
  readonly snapshot: CockpitDaemonSnapshot;
  readonly statusLabel: string;
  readonly refinerGlyphPalette: GlyphPalette;
  readonly reviewerGlyphPalette: GlyphPalette;
  readonly codifierGlyphColors: GlyphColorMap;
}
