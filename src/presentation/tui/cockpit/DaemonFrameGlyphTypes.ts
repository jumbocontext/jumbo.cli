export interface DaemonFrameGlyphStyle {
  readonly color: string;
  readonly dimColor?: boolean;
}

export type DaemonFrameGlyphColorMap = Readonly<Record<string, string>>;

export type DaemonFrameGlyphPalette = readonly string[];

export interface DaemonFrameGlyphCell {
  readonly glyph: string;
  readonly color: string;
}
