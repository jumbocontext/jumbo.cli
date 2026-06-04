import type { CockpitDaemonSnapshot } from "../CockpitDaemonSnapshot.js";
import type {
  DaemonFrameGlyphColorMap,
  DaemonFrameGlyphPalette,
} from "../DaemonFrameGlyphTypes.js";

export interface IDaemonFrame {
  readonly frameIndex: number;
  readonly snapshot: CockpitDaemonSnapshot;
  readonly statusLabel: string;
  readonly refinerGlyphPalette: DaemonFrameGlyphPalette;
  readonly reviewerGlyphPalette: DaemonFrameGlyphPalette;
  readonly codifierGlyphColors: DaemonFrameGlyphColorMap;
}
